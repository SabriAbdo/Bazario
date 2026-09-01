package com.bazario.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public class CartDto {

    public record AddRequest(@NotNull Long productId, @Min(1) int quantity) {}

    public record UpdateRequest(@Min(1) int quantity) {}

    public record CartItemResponse(
            Long id,
            Long productId,
            String productName,
            String productImageUrl,
            BigDecimal unitPrice,
            int quantity,
            BigDecimal subtotal
    ) {}

    public record CartResponse(
            List<CartItemResponse> items,
            BigDecimal total
    ) {}
}
