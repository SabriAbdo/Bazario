package com.bazario.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "product_variants")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VariantType type;

    /** Display value: e.g. "S", "Rouge", "128 Go" */
    @Column(nullable = false, length = 100)
    private String valeur;

    /** Extra price on top of the base product price. 0 means same price. */
    @Column(name = "prix_supplement", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal prixSupplement = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private int stock = 0;

    public enum VariantType {
        SIZE, COLOR, STORAGE
    }
}
