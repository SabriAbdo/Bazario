package com.bazario.controller;

import com.bazario.dto.NotificationDto;
import com.bazario.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** Any authenticated staff member (Admin/Operateur/Stock Operateur) — recent notifications */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPERATEUR') or hasRole('STOCK_OPERATEUR')")
    public ResponseEntity<List<NotificationDto.Response>> getRecent() {
        return ResponseEntity.ok(notificationService.getRecent());
    }

    @GetMapping("/count")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPERATEUR') or hasRole('STOCK_OPERATEUR')")
    public ResponseEntity<NotificationDto.CountResponse> countSince(@RequestParam(required = false) Long sinceId) {
        return ResponseEntity.ok(notificationService.countSince(sinceId));
    }
}
