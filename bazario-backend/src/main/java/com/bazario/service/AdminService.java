package com.bazario.service;

import com.bazario.dto.AdminDto;
import com.bazario.dto.AuthDto;
import com.bazario.entity.Category;
import com.bazario.entity.Order;
import com.bazario.entity.Product;
import com.bazario.entity.User;
import com.bazario.exception.BadRequestException;
import com.bazario.exception.ConflictException;
import com.bazario.exception.ResourceNotFoundException;
import com.bazario.repository.OrderItemRepository;
import com.bazario.repository.OrderRepository;
import com.bazario.repository.ProductRepository;
import com.bazario.repository.ProductVariantRepository;
import com.bazario.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogService activityLogService;

    public AdminDto.StatsResponse getStats() {
        return new AdminDto.StatsResponse(
                userRepository.countByDeletedFalse(),
                productRepository.countByDeletedFalseAndApprovedByAdminTrue(),
                orderRepository.count(),
                orderRepository.countByStatus(Order.OrderStatus.EN_ATTENTE),
                orderRepository.countByStatus(Order.OrderStatus.VALIDEE),
                orderRepository.countByStatus(Order.OrderStatus.REFUSEE),
                productRepository.countByDeletedFalseAndApprovedByAdminFalse(),
                userRepository.countByDeletedFalseAndActiveFalse());
    }

    public AdminDto.AdvancedStatsResponse getAdvancedStats() {
        return getAdvancedStats("DAY");
    }

    public AdminDto.AdvancedStatsResponse getAdvancedStats(String granularityParam) {
        Granularity granularity;
        try {
            granularity = Granularity.valueOf(granularityParam == null ? "DAY" : granularityParam.toUpperCase());
        } catch (IllegalArgumentException e) {
            granularity = Granularity.DAY;
        }
        int bucketCount = switch (granularity) {
            case DAY -> 30;
            case WEEK -> 12;
            case MONTH -> 12;
        };

        java.time.LocalDate today = java.time.LocalDate.now();
        List<java.time.LocalDate> bucketStarts = new java.util.ArrayList<>(bucketCount);
        java.time.LocalDate rangeStart;
        switch (granularity) {
            case WEEK -> {
                java.time.LocalDate thisWeekStart = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                rangeStart = thisWeekStart.minusWeeks(bucketCount - 1);
                for (int i = 0; i < bucketCount; i++) bucketStarts.add(rangeStart.plusWeeks(i));
            }
            case MONTH -> {
                java.time.LocalDate thisMonthStart = today.withDayOfMonth(1);
                rangeStart = thisMonthStart.minusMonths(bucketCount - 1);
                for (int i = 0; i < bucketCount; i++) bucketStarts.add(rangeStart.plusMonths(i));
            }
            default -> {
                rangeStart = today.minusDays(bucketCount - 1);
                for (int i = 0; i < bucketCount; i++) bucketStarts.add(rangeStart.plusDays(i));
            }
        }
        // Keep at least 30 days of history so ordersLast7Days/ordersLast30Days/revenueLast30Days remain accurate.
        java.time.LocalDate fetchStart = rangeStart.isAfter(today.minusDays(29)) ? today.minusDays(29) : rangeStart;
        List<Order> recentOrders = orderRepository.findByCreatedAtAfter(fetchStart.atStartOfDay());

        java.util.Map<java.time.LocalDate, long[]> ordersByBucket = new java.util.LinkedHashMap<>();
        java.util.Map<java.time.LocalDate, java.math.BigDecimal> revenueByBucket = new java.util.LinkedHashMap<>();
        for (java.time.LocalDate b : bucketStarts) {
            ordersByBucket.put(b, new long[]{0});
            revenueByBucket.put(b, java.math.BigDecimal.ZERO);
        }
        java.math.BigDecimal revenueLast30 = java.math.BigDecimal.ZERO;
        long ordersLast7 = 0;
        java.time.LocalDate thirtyDaysAgo = today.minusDays(29);
        java.time.LocalDate sevenDaysAgo = today.minusDays(6);
        for (Order o : recentOrders) {
            java.time.LocalDate d = o.getCreatedAt().toLocalDate();
            java.time.LocalDate bucketKey = switch (granularity) {
                case WEEK -> d.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                case MONTH -> d.withDayOfMonth(1);
                default -> d;
            };
            long[] count = ordersByBucket.get(bucketKey);
            if (count != null) count[0]++;
            if (!d.isBefore(sevenDaysAgo)) ordersLast7++;
            if (o.getStatus() != Order.OrderStatus.REFUSEE && o.getStatus() != Order.OrderStatus.ANNULEE) {
                java.math.BigDecimal orderTotal = o.getItems().stream()
                        .map(it -> it.getPrixSnapshot().multiply(java.math.BigDecimal.valueOf(it.getQuantite())))
                        .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                revenueByBucket.merge(bucketKey, orderTotal, java.math.BigDecimal::add);
                if (!d.isBefore(thirtyDaysAgo)) revenueLast30 = revenueLast30.add(orderTotal);
            }
        }
        java.time.format.DateTimeFormatter labelFmt = switch (granularity) {
            case MONTH -> java.time.format.DateTimeFormatter.ofPattern("MMM yy");
            default -> java.time.format.DateTimeFormatter.ofPattern("dd/MM");
        };
        List<AdminDto.TimeSeriesPoint> revenueSeries = bucketStarts.stream()
                .map(d -> new AdminDto.TimeSeriesPoint(d.format(labelFmt), ordersByBucket.get(d)[0], revenueByBucket.get(d)))
                .toList();


        List<AdminDto.StatusCount> ordersByStatus = java.util.Arrays.stream(Order.OrderStatus.values())
                .map(s -> new AdminDto.StatusCount(s.name(), orderRepository.countByStatus(s)))
                .filter(sc -> sc.count() > 0)
                .toList();

        List<AdminDto.RoleCount> usersByRole = java.util.Arrays.stream(User.Role.values())
                .map(r -> new AdminDto.RoleCount(r.name(), userRepository.countByDeletedFalseAndRole(r)))
                .toList();

        List<Object[]> topRaw = orderItemRepository.findTopSellingProducts(
                Order.OrderStatus.ANNULEE, Order.OrderStatus.REFUSEE, PageRequest.of(0, 5));
        List<AdminDto.TopProduct> topProducts = topRaw.stream()
                .map(r -> new AdminDto.TopProduct(
                        (Long) r[0], (String) r[1], ((Number) r[2]).longValue(), (java.math.BigDecimal) r[3]))
                .toList();

        java.util.Map<String, java.math.BigDecimal> categoryRevenue = new java.util.LinkedHashMap<>();
        java.util.Map<String, Long> categoryQty = new java.util.LinkedHashMap<>();
        List<Object[]> allSales = orderItemRepository.findTopSellingProducts(
                Order.OrderStatus.ANNULEE, Order.OrderStatus.REFUSEE, PageRequest.of(0, 500));
        List<Long> productIds = allSales.stream().map(r -> (Long) r[0]).toList();
        java.util.Map<Long, Product> productMap = productRepository.findAllById(productIds).stream()
                .collect(java.util.stream.Collectors.toMap(Product::getId, p -> p));
        for (Object[] r : allSales) {
            Long productId = (Long) r[0];
            long qty = ((Number) r[2]).longValue();
            java.math.BigDecimal revenue = (java.math.BigDecimal) r[3];
            Product p = productMap.get(productId);
            if (p == null || p.getCategories().isEmpty()) {
                categoryRevenue.merge("Non catégorisé", revenue, java.math.BigDecimal::add);
                categoryQty.merge("Non catégorisé", qty, Long::sum);
                continue;
            }
            for (Category c : p.getCategories()) {
                categoryRevenue.merge(c.getLabel(), revenue, java.math.BigDecimal::add);
                categoryQty.merge(c.getLabel(), qty, Long::sum);
            }
        }
        List<AdminDto.TopCategory> topCategories = categoryRevenue.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(6)
                .map(e -> new AdminDto.TopCategory(e.getKey(), e.getValue(), categoryQty.getOrDefault(e.getKey(), 0L)))
                .toList();

        java.time.format.DateTimeFormatter monthFmt = java.time.format.DateTimeFormatter.ofPattern("MMM yy");
        java.time.LocalDate monthStart = today.withDayOfMonth(1).minusMonths(5);
        java.util.Map<String, Long> growthByMonth = new java.util.LinkedHashMap<>();
        for (int i = 0; i < 6; i++) {
            growthByMonth.put(monthStart.plusMonths(i).format(monthFmt), 0L);
        }
        for (User u : userRepository.findAllByDeletedFalse()) {
            if (u.getCreatedAt() == null) continue;
            java.time.LocalDate created = u.getCreatedAt().toLocalDate();
            if (created.isBefore(monthStart)) continue;
            String key = created.withDayOfMonth(1).format(monthFmt);
            growthByMonth.computeIfPresent(key, (k, v) -> v + 1);
        }
        List<AdminDto.MonthlyPoint> userGrowth = growthByMonth.entrySet().stream()
                .map(e -> new AdminDto.MonthlyPoint(e.getKey(), e.getValue()))
                .toList();

        long totalCommands = orderRepository.count();
        long validees = orderRepository.countByStatus(Order.OrderStatus.VALIDEE);
        double approvalRate = totalCommands == 0 ? 0 : (validees * 100.0) / totalCommands;
        long ordersLast30 = recentOrders.stream()
                .filter(o -> !o.getCreatedAt().toLocalDate().isBefore(thirtyDaysAgo))
                .count();
        java.math.BigDecimal avgOrderValue = ordersLast30 == 0
                ? java.math.BigDecimal.ZERO
                : revenueLast30.divide(java.math.BigDecimal.valueOf(ordersLast30), 2, java.math.RoundingMode.HALF_UP);

        // Whole-history aggregates across all non-cancelled/refused orders
        List<Order> allOrders = orderRepository.findAll();
        java.math.BigDecimal totalRevenueAllTime = java.math.BigDecimal.ZERO;
        long totalItemsAllTime = 0;
        long validOrdersCount = 0;
        java.util.Map<Long, java.math.BigDecimal> spendByCustomer = new java.util.LinkedHashMap<>();
        java.util.Map<Long, Long> ordersByCustomer = new java.util.LinkedHashMap<>();
        java.util.Map<Long, String> customerNames = new java.util.LinkedHashMap<>();
        for (Order o : allOrders) {
            if (o.getStatus() == Order.OrderStatus.REFUSEE || o.getStatus() == Order.OrderStatus.ANNULEE) continue;
            validOrdersCount++;
            java.math.BigDecimal orderTotal = java.math.BigDecimal.ZERO;
            for (var it : o.getItems()) {
                orderTotal = orderTotal.add(it.getPrixSnapshot().multiply(java.math.BigDecimal.valueOf(it.getQuantite())));
                totalItemsAllTime += it.getQuantite();
            }
            totalRevenueAllTime = totalRevenueAllTime.add(orderTotal);
            User customer = o.getCustomer();
            if (customer != null) {
                spendByCustomer.merge(customer.getId(), orderTotal, java.math.BigDecimal::add);
                ordersByCustomer.merge(customer.getId(), 1L, Long::sum);
                customerNames.putIfAbsent(customer.getId(), customer.getFullName());
            }
        }
        double avgItemsPerOrder = validOrdersCount == 0 ? 0 : (double) totalItemsAllTime / validOrdersCount;

        List<AdminDto.TopCustomer> topCustomers = spendByCustomer.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(e -> new AdminDto.TopCustomer(
                        e.getKey(), customerNames.get(e.getKey()), ordersByCustomer.get(e.getKey()), e.getValue()))
                .toList();

        long lowStockVariants = productVariantRepository.countByStockLessThan(5);
        long activeSellers = userRepository.countByDeletedFalseAndRole(User.Role.OPERATEUR);

        return new AdminDto.AdvancedStatsResponse(
                revenueSeries, ordersByStatus, usersByRole, topProducts, topCategories, userGrowth, topCustomers,
                ordersLast7, ordersLast30, revenueLast30, avgOrderValue, approvalRate,
                totalRevenueAllTime, avgItemsPerOrder, lowStockVariants, activeSellers);
    }

    public Page<AuthDto.UserDto> getUsersPaged(String q, int page, int size, String sortField, String sortDir) {
        Sort.Direction dir = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String field = switch (sortField) {
            case "username" -> "username";
            case "role" -> "role";
            case "active" -> "active";
            default -> "fullName";
        };
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, field));
        if (q != null && !q.isBlank()) {
            return userRepository.searchUsersPaged(q, pageable).map(this::toUserDto);
        }
        return userRepository.findAllActive(pageable).map(this::toUserDto);
    }

    public List<AuthDto.UserDto> getAllUsers() {
        return userRepository.findAllByDeletedFalse().stream().map(this::toUserDto).toList();
    }

    public List<AuthDto.UserDto> searchUsers(String q) {
        return userRepository.searchUsers(q).stream().map(this::toUserDto).toList();
    }

    @Transactional
    public AuthDto.UserDto createUser(AdminDto.CreateUserRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new ConflictException("Nom d utilisateur deja utilise");
        }
        if (userRepository.existsByEmail(req.email())) {
            throw new ConflictException("Cet email est deja utilise");
        }
        User user = User.builder()
                .username(req.username())
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .fullName(req.fullName())
                .role(req.role())
                .active(true)
                .build();
        User saved = userRepository.save(user);
        activityLogService.log("Creation utilisateur", "Utilisateur cree: " + saved.getUsername() + " (" + saved.getRole() + ")");
        return toUserDto(saved);
    }

    @Transactional
    public AuthDto.UserDto updateUser(Long id, AdminDto.UpdateUserRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        if (req.username() != null && !req.username().isBlank() && !req.username().equals(user.getUsername())) {
            if (userRepository.existsByUsername(req.username())) {
                throw new ConflictException("Nom d utilisateur deja utilise");
            }
            user.setUsername(req.username());
        }
        if (req.email() != null && !req.email().isBlank() && !req.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(req.email())) {
                throw new ConflictException("Cet email est deja utilise");
            }
            user.setEmail(req.email());
        }
        if (req.password() != null && !req.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.password()));
        }
        if (req.fullName() != null) user.setFullName(req.fullName());
        if (req.role() != null) user.setRole(req.role());
        if (req.active() != null) user.setActive(req.active());
        User saved = userRepository.save(user);
        activityLogService.log("Modification utilisateur", "Utilisateur modifie: " + saved.getUsername());
        return toUserDto(saved);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        // Soft-delete: preserves order history and product records
        user.setDeleted(true);
        user.setActive(false);
        userRepository.save(user);
        activityLogService.log("Suppression utilisateur", "Utilisateur supprime: " + user.getUsername());
    }

    public List<AdminDto.ActivityLogResponse> getActivityLogs() {
        return activityLogService.getLogs();
    }

    @Transactional
    public AuthDto.UserDto banUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        user.setActive(false);
        AuthDto.UserDto dto = toUserDto(userRepository.save(user));
        activityLogService.log("Banissement utilisateur", "Utilisateur banni: " + user.getUsername());
        return dto;
    }

    @Transactional
    public AuthDto.UserDto unbanUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        user.setActive(true);
        AuthDto.UserDto dto = toUserDto(userRepository.save(user));
        activityLogService.log("Reactivation utilisateur", "Utilisateur reactive: " + user.getUsername());
        return dto;
    }

    @Transactional
    public AuthDto.UserDto setAllowedCategories(Long id, String allowedCategories) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        user.setAllowedCategories(allowedCategories == null || allowedCategories.isBlank() ? null : allowedCategories);
        AuthDto.UserDto dto = toUserDto(userRepository.save(user));
        activityLogService.log("Modification categories autorisees", "Utilisateur: " + user.getUsername());
        return dto;
    }

    @Transactional
    public com.bazario.dto.ProductDto.Response approveProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        product.setApprovedByAdmin(true);
        activityLogService.log("Approbation produit", "Produit approuve: " + product.getLibelle());
        return toProductDto(product);
    }

    @Transactional
    public com.bazario.dto.ProductDto.Response rejectProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        product.setApprovedByAdmin(false);
        product.setDeleted(true);
        com.bazario.dto.ProductDto.Response dto = toProductDto(productRepository.save(product));
        activityLogService.log("Rejet produit", "Produit rejete: " + product.getLibelle());
        return dto;
    }

    public Page<com.bazario.dto.ProductDto.Response> getPendingProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return productRepository.findPendingApproval(pageable).map(this::toProductDto);
    }

    @Transactional
    public com.bazario.dto.ProductDto.Response setFeaturedBestSeller(Long id, boolean value) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        product.setFeaturedBestSeller(value);
        activityLogService.log("Mise en avant produit", (value ? "Ajoute" : "Retire") + " des meilleures ventes: " + product.getLibelle());
        return toProductDto(product);
    }

    @Transactional
    public com.bazario.dto.ProductDto.Response setFeaturedNewArrival(Long id, boolean value) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        product.setFeaturedNewArrival(value);
        activityLogService.log("Mise en avant produit", (value ? "Ajoute" : "Retire") + " des nouveautes: " + product.getLibelle());
        return toProductDto(product);
    }

    @Transactional
    public com.bazario.dto.ProductDto.Response setFeaturedPopular(Long id, boolean value) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        product.setFeaturedPopular(value);
        activityLogService.log("Mise en avant produit", (value ? "Ajoute" : "Retire") + " des populaires: " + product.getLibelle());
        return toProductDto(product);
    }

    private AuthDto.UserDto toUserDto(User u) {
        return new AuthDto.UserDto(u.getId(), u.getUsername(), u.getEmail(), u.getFullName(), u.getRole().name(), u.isActive(), u.getAllowedCategories());
    }

    private com.bazario.dto.ProductDto.Response toProductDto(Product p) {
        java.util.List<com.bazario.dto.ProductDto.VariantResponse> variants = p.getVariants() != null
                ? p.getVariants().stream().map(v -> new com.bazario.dto.ProductDto.VariantResponse(
                        v.getId(), v.getType(), v.getValeur(), v.getPrixSupplement(), v.getStock())).toList()
                : java.util.List.of();
        java.util.List<String> categorySlugs = p.getCategories() != null
                ? p.getCategories().stream().map(Category::getSlug).toList()
                : java.util.List.of();
        return new com.bazario.dto.ProductDto.Response(
                p.getId(), p.getLibelle(), p.getDescription(), p.getPrix(),
                p.isPrixActif(), p.getPrixPromo(),
                p.getReference(), p.getMarque(), categorySlugs,
                p.getUnite() != null ? p.getUnite() : com.bazario.entity.Unite.PIECE,
                p.getQuantiteMin(),
                p.getCreatedBy() != null ? p.getCreatedBy().getId() : null,
                p.getCreatedBy() != null ? p.getCreatedBy().getFullName() : null,
                p.getCreatedAt(),
                p.getImages() != null ? p.getImages() : java.util.List.of(),
                p.isDeleted(), variants, p.isApprovedByAdmin(), p.getLikesCount(),
                p.isFeaturedBestSeller(), p.isFeaturedNewArrival(), p.isFeaturedPopular());
    }

    private enum Granularity { DAY, WEEK, MONTH }
}
