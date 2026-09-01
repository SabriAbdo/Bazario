package com.bazario.controller;

import com.bazario.dto.OrderDto;
import com.bazario.entity.Order;
import com.bazario.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;

import java.util.List;

@RestController
@RequestMapping("/api/v1/commands")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /** Public — Visiteur places an order */
    @PostMapping
    public ResponseEntity<OrderDto.Response> placeOrder(@Valid @RequestBody OrderDto.PlaceRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOrder(req));
    }

    /** Public — Visiteur submits a demande d'information */
    @PostMapping("/demande-info")
    public ResponseEntity<OrderDto.Response> demandeInfo(@Valid @RequestBody OrderDto.DemandeInfoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeDemandeInfo(req));
    }

    /** Operateur & Admin — list all orders, paged */
    @GetMapping
    @PreAuthorize("hasRole('OPERATEUR') or hasRole('ADMIN')")
    public ResponseEntity<Page<OrderDto.Response>> getAll(
            @RequestParam(required = false) Order.OrderStatus status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(orderService.getOrdersPaged(status, q, page, size, sort, sortDir));
    }

    @GetMapping("/historique")
    @PreAuthorize("hasRole('OPERATEUR') or hasRole('ADMIN')")
    public ResponseEntity<Page<OrderDto.Response>> getHistorique(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "updatedAt") String sort,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(orderService.getHistoriquePaged(q, page, size, sort, sortDir));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OPERATEUR') or hasRole('ADMIN')")
    public ResponseEntity<OrderDto.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('OPERATEUR') or hasRole('ADMIN')")
    public ResponseEntity<OrderDto.Response> updateStatus(
            @PathVariable Long id,
            @RequestBody OrderDto.StatusUpdateRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.updateStatus(id, req.status(), userDetails.getUsername()));
    }
}
