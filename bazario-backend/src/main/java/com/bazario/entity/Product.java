package com.bazario.entity;

import jakarta.persistence.*;
import lombok.*;

import jakarta.persistence.CascadeType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String libelle;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal prix;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "prix_actif", nullable = false)
    @Builder.Default
    private boolean prixActif = true;

    @Column(name = "prix_promo", precision = 18, scale = 2)
    private BigDecimal prixPromo;

    @Column(length = 100)
    private String reference;

    @Column(length = 100)
    private String marque;

    @Column(length = 50)
    private String categorie;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Builder.Default
    private Unite unite = Unite.PIECE;

    @Column(name = "quantite_min", nullable = false)
    @Builder.Default
    private int quantiteMin = 1;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private boolean deleted = false;

    /** True when an admin has approved this product for the public catalogue */
    @Column(name = "approved_by_admin", nullable = false)
    @Builder.Default
    private boolean approvedByAdmin = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url", length = 500)
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
