package com.bazario.service;

import com.bazario.dto.AdminDto;
import com.bazario.dto.AuthDto;
import com.bazario.entity.AppConfig;
import com.bazario.entity.Order;
import com.bazario.entity.Product;
import com.bazario.entity.User;
import com.bazario.exception.BadRequestException;
import com.bazario.exception.ConflictException;
import com.bazario.exception.ResourceNotFoundException;
import com.bazario.repository.AppConfigRepository;
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
        return new com.bazario.dto.ProductDto.Response(
                p.getId(), p.getLibelle(), p.getDescription(), p.getPrix(),
                p.isPrixActif(), p.getPrixPromo(),
                p.getReference(), p.getMarque(), p.getCategorie(),
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
