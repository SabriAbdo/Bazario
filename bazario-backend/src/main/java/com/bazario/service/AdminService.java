package com.bazario.service;

import com.bazario.dto.AdminDto;
import com.bazario.dto.AuthDto;
import com.bazario.entity.AppConfig;
import com.bazario.entity.Category;
import com.bazario.entity.Order;
import com.bazario.entity.Product;
import com.bazario.entity.User;
import com.bazario.exception.BadRequestException;
import com.bazario.exception.ConflictException;
import com.bazario.exception.ResourceNotFoundException;
import com.bazario.repository.AppConfigRepository;
import com.bazario.repository.OrderItemRepository;
import com.bazario.repository.OrderRepository;
import com.bazario.repository.ProductRepository;
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
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final AppConfigRepository activityLogRepository;
    private final PasswordEncoder passwordEncoder;

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
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate startDate = today.minusDays(29);
        List<Order> recentOrders = orderRepository.findByCreatedAtAfter(startDate.atStartOfDay());

        java.util.Map<java.time.LocalDate, long[]> ordersByDay = new java.util.LinkedHashMap<>();
        java.util.Map<java.time.LocalDate, java.math.BigDecimal> revenueByDay = new java.util.LinkedHashMap<>();
        for (int i = 0; i < 30; i++) {
            java.time.LocalDate d = startDate.plusDays(i);
            ordersByDay.put(d, new long[]{0});
            revenueByDay.put(d, java.math.BigDecimal.ZERO);
        }
        java.math.BigDecimal revenueLast30 = java.math.BigDecimal.ZERO;
        long ordersLast7 = 0;
        java.time.LocalDate sevenDaysAgo = today.minusDays(6);
        for (Order o : recentOrders) {
            java.time.LocalDate d = o.getCreatedAt().toLocalDate();
            long[] count = ordersByDay.get(d);
            if (count != null) count[0]++;
            if (!d.isBefore(sevenDaysAgo)) ordersLast7++;
            if (o.getStatus() != Order.OrderStatus.REFUSEE && o.getStatus() != Order.OrderStatus.ANNULEE) {
                java.math.BigDecimal orderTotal = o.getItems().stream()
                        .map(it -> it.getPrixSnapshot().multiply(java.math.BigDecimal.valueOf(it.getQuantite())))
                        .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                revenueByDay.merge(d, orderTotal, java.math.BigDecimal::add);
                revenueLast30 = revenueLast30.add(orderTotal);
            }
        }
        java.time.format.DateTimeFormatter dayFmt = java.time.format.DateTimeFormatter.ofPattern("dd/MM");
        List<AdminDto.TimeSeriesPoint> revenueSeries = ordersByDay.keySet().stream()
                .map(d -> new AdminDto.TimeSeriesPoint(d.format(dayFmt), ordersByDay.get(d)[0], revenueByDay.get(d)))
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
        long ordersLast30 = recentOrders.size();
        java.math.BigDecimal avgOrderValue = ordersLast30 == 0
                ? java.math.BigDecimal.ZERO
                : revenueLast30.divide(java.math.BigDecimal.valueOf(ordersLast30), 2, java.math.RoundingMode.HALF_UP);

        return new AdminDto.AdvancedStatsResponse(
                revenueSeries, ordersByStatus, usersByRole, topProducts, topCategories, userGrowth,
                ordersLast7, ordersLast30, revenueLast30, avgOrderValue, approvalRate);
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
        User user = User.builder()
                .username(req.username())
                .password(passwordEncoder.encode(req.password()))
                .fullName(req.fullName())
                .role(req.role())
                .active(true)
                .build();
        return toUserDto(userRepository.save(user));
    }

    @Transactional
    public AuthDto.UserDto updateUser(Long id, AdminDto.UpdateUserRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        if (req.fullName() != null) user.setFullName(req.fullName());
        if (req.role() != null) user.setRole(req.role());
        if (req.active() != null) user.setActive(req.active());
        return toUserDto(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        // Soft-delete: preserves order history and product records
        user.setDeleted(true);
        user.setActive(false);
        userRepository.save(user);
    }

    public List<AdminDto.ActivityLogResponse> getActivityLogs() {
        return activityLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(this::toLogDto).toList();
    }

    @Transactional
    public void logActivity(User user, String action, String details) {
        AppConfig log = AppConfig.builder()
                .user(user)
                .action(action)
                .details(details)
                .build();
        activityLogRepository.save(log);
    }

    @Transactional
    public AuthDto.UserDto banUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        user.setActive(false);
        return toUserDto(userRepository.save(user));
    }

    @Transactional
    public AuthDto.UserDto unbanUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        user.setActive(true);
        return toUserDto(userRepository.save(user));
    }

    @Transactional
    public AuthDto.UserDto setAllowedCategories(Long id, String allowedCategories) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        user.setAllowedCategories(allowedCategories == null || allowedCategories.isBlank() ? null : allowedCategories);
        return toUserDto(userRepository.save(user));
    }

    @Transactional
    public com.bazario.dto.ProductDto.Response approveProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        product.setApprovedByAdmin(true);
        return toProductDto(product);
    }

    @Transactional
    public com.bazario.dto.ProductDto.Response rejectProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        product.setApprovedByAdmin(false);
        product.setDeleted(true);
        return toProductDto(productRepository.save(product));
    }

    public Page<com.bazario.dto.ProductDto.Response> getPendingProducts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return productRepository.findPendingApproval(pageable).map(this::toProductDto);
    }

    private AuthDto.UserDto toUserDto(User u) {
        return new AuthDto.UserDto(u.getId(), u.getUsername(), u.getFullName(), u.getRole().name(), u.isActive(), u.getAllowedCategories());
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
                p.isDeleted(), variants, p.isApprovedByAdmin());
    }

    private AdminDto.ActivityLogResponse toLogDto(AppConfig log) {
        return new AdminDto.ActivityLogResponse(
                log.getId(),
                log.getUser() != null ? log.getUser().getId() : null,
                log.getUser() != null ? log.getUser().getFullName() : "Systeme",
                log.getAction(),
                log.getDetails(),
                log.getCreatedAt() != null ? log.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
    }
}
