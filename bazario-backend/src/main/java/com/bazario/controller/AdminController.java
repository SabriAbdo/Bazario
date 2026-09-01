package com.bazario.controller;

import com.bazario.dto.AdminDto;
import com.bazario.dto.AuthDto;
import com.bazario.dto.ProductDto;
import com.bazario.entity.User;
import com.bazario.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminDto.StatsResponse> stats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<AuthDto.UserDto>> getUsers(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "fullName") String sort,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(adminService.getUsersPaged(q, page, size, sort, sortDir));
    }

    @PostMapping("/users")
    public ResponseEntity<AuthDto.UserDto> createUser(@Valid @RequestBody AdminDto.CreateUserRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createUser(req));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<AuthDto.UserDto> updateUser(
            @PathVariable Long id,
            @RequestBody AdminDto.UpdateUserRequest req) {
        return ResponseEntity.ok(adminService.updateUser(id, req));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<AuthDto.UserDto> changeRole(
            @PathVariable Long id,
            @RequestParam String role) {
        User.Role parsed = User.Role.valueOf(role.toUpperCase());
        return ResponseEntity.ok(adminService.updateUser(id, new AdminDto.UpdateUserRequest(null, parsed, null)));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{id}/ban")
    public ResponseEntity<AuthDto.UserDto> banUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.banUser(id));
    }

    @PatchMapping("/users/{id}/unban")
    public ResponseEntity<AuthDto.UserDto> unbanUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.unbanUser(id));
    }

    @PutMapping("/users/{id}/categories")
    public ResponseEntity<AuthDto.UserDto> setAllowedCategories(
            @PathVariable Long id,
            @RequestBody AdminDto.SetAllowedCategoriesRequest req) {
        return ResponseEntity.ok(adminService.setAllowedCategories(id, req.allowedCategories()));
    }

    @PatchMapping("/products/{id}/approve")
    public ResponseEntity<ProductDto.Response> approveProduct(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.approveProduct(id));
    }

    @PatchMapping("/products/{id}/reject")
    public ResponseEntity<ProductDto.Response> rejectProduct(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.rejectProduct(id));
    }

    @GetMapping("/products/pending")
    public ResponseEntity<Page<ProductDto.Response>> getPendingProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getPendingProducts(page, size));
    }

    @GetMapping("/activite")
    public ResponseEntity<List<AdminDto.ActivityLogResponse>> getActivityLogs() {
        return ResponseEntity.ok(adminService.getActivityLogs());
    }
}

