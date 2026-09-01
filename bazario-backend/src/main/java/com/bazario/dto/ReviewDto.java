package com.bazario.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public class ReviewDto {

    public record CreateRequest(
            @NotNull @Min(1) @Max(5) Short rating,
            @Size(max = 2000) String comment
    ) {}

    public record Response(
            Long id,
            Long productId,
            Long buyerId,
            String buyerName,
            String buyerAvatarUrl,
            short rating,
            String comment,
            LocalDateTime createdAt
    ) {}
}
