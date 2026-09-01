package com.bazario.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_categories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50, nullable = false, unique = true)
    private String slug;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(length = 50)
    private String icon;

    @Column(name = "image_url", length = 500)
    private String imageUrl;
}
