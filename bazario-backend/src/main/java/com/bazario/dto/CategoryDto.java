package com.bazario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CategoryDto {

    public record CreateRequest(
            @NotBlank @Size(max = 100) String label,
            @Size(max = 50)           String icon
    ) {}

    public record UpdateRequest(
            @Size(max = 100) String label,
            @Size(max = 50)  String icon,
            @Size(max = 500) String imageUrl
    ) {}

    public record Response(
            Long   id,
            String slug,
            String label,
            String icon,
            String imageUrl
    ) {}
}
