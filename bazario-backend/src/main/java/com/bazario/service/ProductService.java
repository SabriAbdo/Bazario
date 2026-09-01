package com.bazario.service;

import com.bazario.dto.ProductDto;
import com.bazario.entity.Product;
import com.bazario.entity.ProductVariant;
import com.bazario.entity.User;
import com.bazario.exception.ResourceNotFoundException;
import com.bazario.repository.ProductRepository;
import com.bazario.repository.ProductVariantRepository;
import com.bazario.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.security.access.AccessDeniedException;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository variantRepository;

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

    @Transactional
    public ProductDto.Response create(ProductDto.CreateRequest req, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        // Admin-created products are auto-approved; STOCK_OPERATEUR products need admin review
        boolean autoApproved = user.getRole() == com.bazario.entity.User.Role.ADMIN;

        // Enforce category restrictions for STOCK_OPERATEUR
        if (user.getRole() == User.Role.STOCK_OPERATEUR
                && user.getAllowedCategories() != null && !user.getAllowedCategories().isBlank()) {
            List<String> allowed = Arrays.asList(user.getAllowedCategories().split(","));
            if (req.categorie() != null && !allowed.contains(req.categorie().trim())) {
                throw new AccessDeniedException("Catégorie non autorisée pour cet opérateur");
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
                .categorie(req.categorie())
                .unite(req.unite() != null ? req.unite() : com.bazario.entity.Unite.PIECE)
                .quantiteMin(req.quantiteMin() != null ? req.quantiteMin() : 1)
                .deleted(false)
                .approvedByAdmin(autoApproved)
                .createdBy(user)
                .build();
        return toDto(productRepository.save(product));
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
        if (req.categorie() != null && user.getRole() == User.Role.STOCK_OPERATEUR
                && user.getAllowedCategories() != null && !user.getAllowedCategories().isBlank()) {
            List<String> allowed = Arrays.asList(user.getAllowedCategories().split(","));
            if (!allowed.contains(req.categorie().trim())) {
                throw new AccessDeniedException("Catégorie non autorisée pour cet opérateur");
            }
        }

        if (req.libelle() != null) product.setLibelle(req.libelle());
        if (req.description() != null) product.setDescription(req.description());
        if (req.prix() != null) product.setPrix(req.prix());
        if (req.prixActif() != null) product.setPrixActif(req.prixActif());
        if (req.prixPromo() != null) product.setPrixPromo(req.prixPromo());
        if (req.reference() != null) product.setReference(req.reference());
        if (req.marque() != null) product.setMarque(req.marque());
        if (req.categorie() != null) product.setCategorie(req.categorie());
        if (req.unite() != null) product.setUnite(req.unite());
        if (req.quantiteMin() != null) product.setQuantiteMin(req.quantiteMin());

        return toDto(productRepository.save(product));
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
        try {
            Path dir = Paths.get(uploadDir, "products", String.valueOf(id)).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                String ext = "";
                String orig = file.getOriginalFilename();
                if (orig != null && orig.contains(".")) ext = orig.substring(orig.lastIndexOf("."));
                String filename = UUID.randomUUID() + ext;
                Files.copy(file.getInputStream(), dir.resolve(filename));
                product.getImages().add("/uploads/products/" + id + "/" + filename);
            }
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'upload des images", e);
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
        // delete physical file
        try {
            String filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
            Path file = Paths.get(uploadDir, "products", String.valueOf(id), filename).toAbsolutePath().normalize();
            Files.deleteIfExists(file);
        } catch (IOException ignored) {}
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
        return toDto(productRepository.save(product));
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

    private ProductDto.Response toDto(Product p) {
        List<ProductDto.VariantResponse> variants = p.getVariants() != null
                ? p.getVariants().stream().map(this::toVariantDto).toList()
                : List.of();
        return new ProductDto.Response(
                p.getId(), p.getLibelle(), p.getDescription(), p.getPrix(),
                p.isPrixActif(), p.getPrixPromo(),
                p.getReference(), p.getMarque(), p.getCategorie(),
                p.getUnite() != null ? p.getUnite() : com.bazario.entity.Unite.PIECE,
                p.getQuantiteMin(),
                p.getCreatedBy() != null ? p.getCreatedBy().getId() : null,
                p.getCreatedBy() != null ? p.getCreatedBy().getFullName() : null,
                p.getCreatedAt(),
                p.getImages() != null ? p.getImages() : List.of(),
                p.isDeleted(),
                variants,
                p.isApprovedByAdmin());
    }
}
