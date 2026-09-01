package com.bazario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDto {

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            String accessToken,
            UserDto user
    ) {}

    public record UserDto(
            Long id,
            String username,
            String fullName,
            String role,
            boolean active,
            String allowedCategories
    ) {}
}
