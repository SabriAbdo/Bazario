package com.bazario.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDto {

    /** {@code username} may be either the account's username or its email address */
    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {}

    public record RegisterRequest(
            @NotBlank @Size(max = 100) String username,
            @NotBlank @Email @Size(max = 150) String email,
            @NotBlank @Size(min = 6, max = 100) String password,
            @NotBlank String fullName
    ) {}

    public record AuthResponse(
            String accessToken,
            UserDto user
    ) {}

    public record UserDto(
            Long id,
            String username,
            String email,
            String fullName,
            String role,
            boolean active,
            String allowedCategories
    ) {}
}
