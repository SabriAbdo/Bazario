package com.bazario.dto;

import com.bazario.entity.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * DTOs for Admin operations (user management, activity logs).
 */
public class AdminDto {

    public record CreateUserRequest(
            @NotBlank @Size(max = 100) String username,
            @NotBlank @Size(min = 6, max = 100) String password,
            @NotBlank String fullName,
            @NotNull User.Role role,
            String email
    ) {}

    public record UpdateUserRequest(
            String username,
            String email,
            String password,
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

    public record TimeSeriesPoint(
            String date,
            long orders,
            java.math.BigDecimal revenue
    ) {}

    public record StatusCount(
            String status,
            long count
    ) {}

    public record RoleCount(
            String role,
            long count
    ) {}

    public record TopProduct(
            Long productId,
            String label,
            long quantitySold,
            java.math.BigDecimal revenue
    ) {}

    public record TopCategory(
            String label,
            java.math.BigDecimal revenue,
            long quantitySold
    ) {}

    public record MonthlyPoint(
            String month,
            long count
    ) {}

    public record TopCustomer(
            Long customerId,
            String name,
            long orderCount,
            java.math.BigDecimal totalSpent
    ) {}

    public record AdvancedStatsResponse(
            List<TimeSeriesPoint> revenueSeries,
            List<StatusCount> ordersByStatus,
            List<RoleCount> usersByRole,
            List<TopProduct> topProducts,
            List<TopCategory> topCategories,
            List<MonthlyPoint> userGrowth,
            List<TopCustomer> topCustomers,
            long ordersLast7Days,
            long ordersLast30Days,
            java.math.BigDecimal revenueLast30Days,
            java.math.BigDecimal avgOrderValue,
            double approvalRate,
            java.math.BigDecimal totalRevenueAllTime,
            double avgItemsPerOrder,
            long lowStockVariants,
            long activeSellers
    ) {}
}
