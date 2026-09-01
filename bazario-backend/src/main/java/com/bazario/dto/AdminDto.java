package com.bazario.dto;

import com.bazario.entity.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTOs for Admin operations (user management, activity logs).
 */
public class AdminDto {

    public record CreateUserRequest(
            @NotBlank @Size(max = 100) String username,
            @NotBlank @Size(min = 6, max = 100) String password,
            @NotBlank String fullName,
            User.Role role
    ) {}

    public record UpdateUserRequest(
            String fullName,
            User.Role role,
            Boolean active
    ) {}

    public record ActivityLogResponse(
            Long id,
            Long userId,
            String userFullName,
            String action,
            String details,
            String createdAt
    ) {}

    public record StatsResponse(
            long totalUsers,
            long totalProducts,
            long totalCommands,
            long commandsEnAttente,
            long commandsValidees,
            long commandsRefusees,
            long pendingApprovalProducts,
            long bannedUsers
    ) {}

    public record SetAllowedCategoriesRequest(
            String allowedCategories
    ) {}
}
