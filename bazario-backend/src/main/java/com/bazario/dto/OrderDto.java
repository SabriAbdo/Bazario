package com.bazario.dto;

import com.bazario.entity.Order;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDto {

    public record PlaceRequest(
            @NotBlank String nom,
            @NotBlank String prenom,
            @NotBlank @Pattern(regexp = "^[+0-9 \\-]{6,20}$") String telephone,
            @Email String email,
            @NotEmpty List<ItemRequest> items
    ) {}

    public record DemandeInfoRequest(
            @NotBlank String nom,
            @NotBlank String prenom,
            @NotBlank @Pattern(regexp = "^[+0-9 \\-]{6,20}$") String telephone,
            @Email String email
    ) {}

    public record ItemRequest(Long productId, int quantite) {}

    public record Response(
            Long id,
            String nom,
            String prenom,
            String adresse,
            String telephone,
            String email,
            String status,
            String type,
            List<ItemResponse> items,
            String treatedBy,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            List<StatusHistoryEntry> history
    ) {}

    public record ItemResponse(
            Long productId,
            String libelleSnapshot,
            BigDecimal prixSnapshot,
            int quantite
    ) {}

    public record StatusHistoryEntry(
            String status,
            LocalDateTime changedAt,
            String changedBy
    ) {}

    public record StatusUpdateRequest(Order.OrderStatus status) {}
}
