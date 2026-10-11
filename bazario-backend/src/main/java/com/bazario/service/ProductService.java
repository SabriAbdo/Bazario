package com.bazario.service;

import com.bazario.dto.ProductDto;
import com.bazario.entity.Category;
import com.bazario.entity.Product;
import com.bazario.entity.ProductVariant;
import com.bazario.entity.User;
import com.bazario.exception.ResourceNotFoundException;
import com.bazario.repository.CategorieRepository;
import com.bazario.repository.ProductRepository;
import com.bazario.repository.ProductVariantRepository;
import com.bazario.repository.OrderItemRepository;
import com.bazario.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository variantRepository;
    private final CategorieRepository categorieRepository;
    private final OrderItemRepository orderItemRepository;
    private final CloudinaryService cloudinaryService;
    private final ActivityLogService activityLogService;

    public Page<ProductDto.Response> getProductsPaged(
            String q, String categorie, String marque,
            BigDecimal minPrix, BigDecimal maxPrix,
            int page, int size, String sortField, String sortDir) {
        Sort.Direction dir = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String field = switch (sortField) {
            case "libelle", "name" -> "libelle";
            case "prix", "price" -> "prix";
            case "marque" -> "marque";
            default -> "createdAt";
        };
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, field));
        return productRepository.filterProducts(
            q == null || q.isBlank() ? null : q,
            categorie == null || categorie.isBlank() ? null : categorie,
            marque == null || marque.isBlank() ? null : marque,
            minPrix, maxPrix, pageable
        ).map(this::toDto);
    }

    public List<ProductDto.Response> getAllProducts() {
        return productRepository.findAllActiveApproved()
                .stream().map(this::toDto).toList();
    }

    /** Best-selling approved products: admin-curated picks first, then ranked by total quantity sold; falls back to newest products when still short */
    public List<ProductDto.Response> getBestSellers(int limit) {
        List<ProductDto.Response> result = new java.util.ArrayList<>();
        Set<Long> seen = new java.util.HashSet<>();

        productRepository.findByFeaturedBestSellerTrueAndDeletedFalseAndApprovedByAdminTrueOrderByCreatedAtDesc()
                .stream().limit(limit)
                .forEach(p -> { if (seen.add(p.getId())) result.add(toDto(p)); });

        if (result.size() < limit) {
            List<Long> rankedIds = orderItemRepository.findBestSellingProductIds(
                    com.bazario.entity.Order.OrderStatus.ANNULEE,
                    com.bazario.entity.Order.OrderStatus.REFUSEE,
                    PageRequest.of(0, limit));
            Map<Long, com.bazario.entity.Product> byId = productRepository.findAllById(rankedIds).stream()
                    .filter(p -> !p.isDeleted() && p.isApprovedByAdmin())
                    .collect(Collectors.toMap(com.bazario.entity.Product::getId, p -> p, (a, b) -> a, LinkedHashMap::new));

            rankedIds.stream()
                    .map(byId::get)
                    .filter(java.util.Objects::nonNull)
                    .filter(p -> seen.add(p.getId()))
                    .limit((long) limit - result.size())
                    .forEach(p -> result.add(toDto(p)));
        }

        if (result.size() < limit) {
            Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
            productRepository.findByDeletedFalse(pageable).getContent().stream()
                    .filter(com.bazario.entity.Product::isApprovedByAdmin)
                    .filter(p -> seen.add(p.getId()))
                    .limit((long) limit - result.size())
                    .forEach(p -> result.add(toDto(p)));
        }
        return result;
    }

    /** New arrivals: admin-curated picks first, then newest products by creation date */
    public List<ProductDto.Response> getNewArrivals(int limit) {
        List<ProductDto.Response> result = new java.util.ArrayList<>();
        Set<Long> seen = new java.util.HashSet<>();

        productRepository.findByFeaturedNewArrivalTrueAndDeletedFalseAndApprovedByAdminTrueOrderByCreatedAtDesc()
                .stream().limit(limit)
                .forEach(p -> { if (seen.add(p.getId())) result.add(toDto(p)); });

        if (result.size() < limit) {
            Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
            productRepository.findByDeletedFalse(pageable).getContent().stream()
                    .filter(com.bazario.entity.Product::isApprovedByAdmin)
                    .filter(p -> seen.add(p.getId()))
                    .limit((long) limit - result.size())
                    .forEach(p -> result.add(toDto(p)));
        }
        return result;
    }

    /** Popular products: admin-curated picks first, then most-liked products as a fallback */
    public List<ProductDto.Response> getPopularProducts(int limit) {
        List<ProductDto.Response> result = new java.util.ArrayList<>();
        Set<Long> seen = new java.util.HashSet<>();

        productRepository.findByFeaturedPopularTrueAndDeletedFalseAndApprovedByAdminTrueOrderByCreatedAtDesc()
                .stream().limit(limit)
                .forEach(p -> { if (seen.add(p.getId())) result.add(toDto(p)); });

        if (result.size() < limit) {
            Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "likesCount"));
            productRepository.findByDeletedFalse(pageable).getContent().stream()
                    .filter(com.bazario.entity.Product::isApprovedByAdmin)
                    .filter(p -> seen.add(p.getId()))
                    .limit((long) limit - result.size())
                    .forEach(p -> result.add(toDto(p)));
        }
        return result;
    }

    public Page<ProductDto.Response> searchProducts(String q, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return productRepository.searchProducts(q, pageable).map(this::toDto);
    }

    public ProductDto.Response getById(Long id) {
        Product p = productRepository.findById(id)
                .filter(pr -> !pr.isDeleted() && pr.isApprovedByAdmin())
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        return toDto(p);
    }

    /** Same as getById, but also allows the owner (or an admin) to view their own pending (not-yet-approved) product. */
    public ProductDto.Response getById(Long id, String username) {
        Product p = productRepository.findById(id)
                .filter(pr -> !pr.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        if (!p.isApprovedByAdmin()) {
            User user = username != null ? userRepository.findByUsername(username).orElse(null) : null;
            boolean isOwnerOrAdmin = user != null
                    && (user.getRole() == User.Role.ADMIN || p.getCreatedBy().getId().equals(user.getId()));
            if (!isOwnerOrAdmin) {
                throw new ResourceNotFoundException("Produit introuvable");
            }
        }
        return toDto(p);
    }

    @Transactional
    public ProductDto.Response create(ProductDto.CreateRequest req, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        // Admin-created products are auto-approved; STOCK_OPERATEUR products need admin review
        boolean autoApproved = user.getRole() == com.bazario.entity.User.Role.ADMIN;

        Set<Category> categories = resolveCategories(req.categories());

        // Enforce category restrictions for STOCK_OPERATEUR
        if (user.getRole() == User.Role.STOCK_OPERATEUR
                && user.getAllowedCategories() != null && !user.getAllowedCategories().isBlank()) {
            List<String> allowed = Arrays.asList(user.getAllowedCategories().split(","));
            for (Category c : categories) {
                if (!allowed.contains(c.getSlug())) {
                    throw new AccessDeniedException("Catégorie non autorisée pour cet opérateur");
                }
            }
        }

        Product product = Product.builder()
                .libelle(req.libelle())
                .description(req.description())
                .prix(req.prix())
                .prixActif(req.prixActif() != null ? req.prixActif() : true)
                .prixPromo(req.prixPromo())
                .reference(req.reference())
                .marque(req.marque())
                .categories(categories)
                .unite(req.unite() != null ? req.unite() : com.bazario.entity.Unite.PIECE)
                .quantiteMin(req.quantiteMin() != null ? req.quantiteMin() : 1)
                .deleted(false)
                .approvedByAdmin(autoApproved)
                .createdBy(user)
                .build();
        Product saved = productRepository.save(product);
        activityLogService.log("Creation produit", "Produit cree: " + saved.getLibelle());
        return toDto(saved);
    }

    @Transactional
    public ProductDto.Response update(Long id, ProductDto.UpdateRequest req, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Product product = productRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));

        if (user.getRole() != User.Role.ADMIN && !product.getCreatedBy().getId().equals(user.getId())) {
            throw new AccessDeniedException("Vous ne pouvez modifier que vos propres produits");
        }

        // Once admin-approved, catalogue data becomes admin-controlled; the owning operator can no longer edit it
        if (user.getRole() != User.Role.ADMIN && product.isApprovedByAdmin()) {
            throw new AccessDeniedException("Ce produit est déjà approuvé : il ne peut plus être modifié");
        }

        Set<Category> categories = req.categories() != null ? resolveCategories(req.categories()) : null;
        if (categories != null && user.getRole() == User.Role.STOCK_OPERATEUR
                && user.getAllowedCategories() != null && !user.getAllowedCategories().isBlank()) {
            List<String> allowed = Arrays.asList(user.getAllowedCategories().split(","));
            for (Category c : categories) {
                if (!allowed.contains(c.getSlug())) {
                    throw new AccessDeniedException("Catégorie non autorisée pour cet opérateur");
                }
            }
        }

        if (req.libelle() != null) product.setLibelle(req.libelle());
        if (req.description() != null) product.setDescription(req.description());
        if (req.prix() != null) product.setPrix(req.prix());
        if (req.prixActif() != null) product.setPrixActif(req.prixActif());
        if (req.prixPromo() != null) product.setPrixPromo(req.prixPromo());
        if (req.reference() != null) product.setReference(req.reference());
        if (req.marque() != null) product.setMarque(req.marque());
        if (categories != null) product.setCategories(categories);
        if (req.unite() != null) product.setUnite(req.unite());
        if (req.quantiteMin() != null) product.setQuantiteMin(req.quantiteMin());

        ProductDto.Response dto = toDto(productRepository.save(product));
        activityLogService.log("Modification produit", "Produit modifie: " + product.getLibelle());
        return dto;
    }

    @Transactional
    public void delete(Long id, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        if (user.getRole() != User.Role.ADMIN && !product.getCreatedBy().getId().equals(user.getId())) {
            throw new AccessDeniedException("Vous ne pouvez supprimer que vos propres produits");
        }
        product.setDeleted(true);
        productRepository.save(product);
        activityLogService.log("Suppression produit", "Produit supprime: " + product.getLibelle());
    }

    public Page<ProductDto.Response> getProductsByCreator(String username, int page, int size, String sortField, String sortDir, String q) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Sort.Direction dir = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String field = switch (sortField) {
            case "libelle" -> "libelle";
            case "prix" -> "prix";
            default -> "createdAt";
        };
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, field));
        if (q != null && !q.isBlank()) {
            return productRepository.searchByCreator(q, user, pageable).map(this::toDto);
        }
        return productRepository.findByCreatedByAndDeletedFalse(user, pageable).map(this::toDto);
    }

    @Transactional
    public ProductDto.Response addImages(Long id, MultipartFile[] files, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Product product = productRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        if (user.getRole() != User.Role.ADMIN && !product.getCreatedBy().getId().equals(user.getId())) {
            throw new AccessDeniedException("Vous ne pouvez modifier que vos propres produits");
        }
        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            product.getImages().add(cloudinaryService.upload(file, "bazario/products/" + id));
        }
        return toDto(productRepository.save(product));
    }

    @Transactional
    public ProductDto.Response deleteImage(Long id, String imageUrl, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Product product = productRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        if (user.getRole() != User.Role.ADMIN && !product.getCreatedBy().getId().equals(user.getId())) {
            throw new AccessDeniedException("Vous ne pouvez modifier que vos propres produits");
        }
        product.getImages().remove(imageUrl);
        cloudinaryService.delete(imageUrl);
        return toDto(productRepository.save(product));
    }

    public List<ProductDto.Response> getDeletedProducts(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        List<Product> products = user.getRole() == com.bazario.entity.User.Role.ADMIN
                ? productRepository.findAllDeleted()
                : productRepository.findDeletedByCreatedBy(user);
        return products.stream().map(this::toDto).toList();
    }

    public Page<ProductDto.Response> getDeletedProductsPaged(String username, int page, int size, String sortField, String sortDir) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Sort.Direction dir = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String field = switch (sortField) {
            case "libelle" -> "libelle";
            case "prix" -> "prix";
            default -> "createdAt";
        };
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, field));
        Page<Product> products = user.getRole() == com.bazario.entity.User.Role.ADMIN
                ? productRepository.findAllDeletedPaged(pageable)
                : productRepository.findDeletedByCreatedByPaged(user, pageable);
        return products.map(this::toDto);
    }

    @Transactional
    public ProductDto.Response restore(Long id, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        // Only admins can restore deleted products
        if (user.getRole() != com.bazario.entity.User.Role.ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Seul un admin peut restaurer des produits");
        }
        Product product = productRepository.findById(id)
                .filter(p -> p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Produit supprim\u00e9 introuvable"));
        product.setDeleted(false);
        product.setApprovedByAdmin(true);
        ProductDto.Response dto = toDto(productRepository.save(product));
        activityLogService.log("Restauration produit", "Produit restaure: " + product.getLibelle());
        return dto;
    }

    @Transactional
    public ProductDto.Response addVariant(Long productId, ProductDto.VariantRequest req, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Product product = productRepository.findById(productId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        if (user.getRole() != User.Role.ADMIN && !product.getCreatedBy().getId().equals(user.getId())) {
            throw new AccessDeniedException("Vous ne pouvez modifier que vos propres produits");
        }
        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .type(req.type())
                .valeur(req.valeur())
                .prixSupplement(req.prixSupplement() != null ? req.prixSupplement() : java.math.BigDecimal.ZERO)
                .stock(req.stock() != null ? req.stock() : 0)
                .build();
        product.getVariants().add(variant);
        return toDto(productRepository.save(product));
    }

    @Transactional
    public ProductDto.Response deleteVariant(Long productId, Long variantId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Product product = productRepository.findById(productId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        if (user.getRole() != User.Role.ADMIN && !product.getCreatedBy().getId().equals(user.getId())) {
            throw new AccessDeniedException("Vous ne pouvez modifier que vos propres produits");
        }
        product.getVariants().removeIf(v -> v.getId().equals(variantId));
        return toDto(productRepository.save(product));
    }

    private ProductDto.VariantResponse toVariantDto(ProductVariant v) {
        return new ProductDto.VariantResponse(v.getId(), v.getType(), v.getValeur(),
                v.getPrixSupplement(), v.getStock());
    }

    /** Resolves category slugs to persisted Category entities; unknown slugs are silently ignored. */
    private Set<Category> resolveCategories(List<String> slugs) {
        if (slugs == null || slugs.isEmpty()) return new LinkedHashSet<>();
        List<String> distinct = slugs.stream().filter(s -> s != null && !s.isBlank()).map(String::trim).distinct().toList();
        return new LinkedHashSet<>(categorieRepository.findBySlugIn(distinct));
    }

    private ProductDto.Response toDto(Product p) {
        List<ProductDto.VariantResponse> variants = p.getVariants() != null
                ? p.getVariants().stream().map(this::toVariantDto).toList()
                : List.of();
        List<String> categorySlugs = p.getCategories() != null
                ? p.getCategories().stream().map(Category::getSlug).toList()
                : List.of();
        return new ProductDto.Response(
                p.getId(), p.getLibelle(), p.getDescription(), p.getPrix(),
                p.isPrixActif(), p.getPrixPromo(),
                p.getReference(), p.getMarque(), categorySlugs,
                p.getUnite() != null ? p.getUnite() : com.bazario.entity.Unite.PIECE,
                p.getQuantiteMin(),
                p.getCreatedBy() != null ? p.getCreatedBy().getId() : null,
                p.getCreatedBy() != null ? p.getCreatedBy().getFullName() : null,
                p.getCreatedAt(),
                p.getImages() != null ? p.getImages() : List.of(),
                p.isDeleted(),
                variants,
                p.isApprovedByAdmin(),
                p.getLikesCount(),
                p.isFeaturedBestSeller(),
                p.isFeaturedNewArrival(),
                p.isFeaturedPopular());
    }
}
