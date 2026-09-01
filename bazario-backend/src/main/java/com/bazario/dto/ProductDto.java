package com.bazario.dto;

import com.bazario.entity.ProductVariant;
import com.bazario.entity.Unite;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ProductDto {

    public record VariantRequest(
            @NotNull ProductVariant.VariantType type,
            @NotBlank @Size(max = 100) String valeur,
            BigDecimal prixSupplement,
            Integer stock
    ) {}

    public record VariantResponse(
            Long id,
            ProductVariant.VariantType type,
            String valeur,
            BigDecimal prixSupplement,
            int stock
    ) {}

    public record CreateRequest(
            @NotBlank @Size(max = 255) String libelle,
            String description,
            @NotNull @DecimalMin("0.01") BigDecimal prix,
            Boolean prixActif,
            @DecimalMin("0.01") BigDecimal prixPromo,
            @Size(max = 100) String reference,
            @Size(max = 100) String marque,
            @Size(max = 50) String categorie,
            Unite unite,
            Integer quantiteMin
    ) {}

    public record UpdateRequest(
            @Size(max = 255) String libelle,
            String description,
            @DecimalMin("0.01") BigDecimal prix,
            Boolean prixActif,
            @DecimalMin("0.01") BigDecimal prixPromo,
            @Size(max = 100) String reference,
            @Size(max = 100) String marque,
            @Size(max = 50) String categorie,
            Unite unite,
            Integer quantiteMin
    ) {}

    public record Response(
            Long id,
            String libelle,
            String description,
            BigDecimal prix,
            boolean prixActif,
            BigDecimal prixPromo,
            String reference,
            String marque,
            String categorie,
            Unite unite,
            int quantiteMin,
            Long createdById,
            String createdByName,
            LocalDateTime createdAt,
            List<String> images,
            boolean deleted,
            List<VariantResponse> variants,
            boolean approvedByAdmin
    ) {}
}
