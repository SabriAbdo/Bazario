package com.bazario.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "command_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "command_id", nullable = false)
    private Order order;

    // Snapshot fields — keep data even if product is modified/deleted
    @Column(name = "product_id")
    private Long productId;

    @Column(name = "libelle_snapshot", nullable = false, length = 255)
    private String libelleSnapshot;

    @Column(name = "prix_snapshot", nullable = false, precision = 18, scale = 2)
    private BigDecimal prixSnapshot;

    @Column(nullable = false)
    private int quantite = 1;
}
