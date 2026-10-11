package com.bazario.controller;

import com.bazario.dto.WishlistDto;
import com.bazario.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENT')")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<List<WishlistDto.Item>> getWishlist(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(wishlistService.getWishlist(userDetails.getUsername()));
    }

    @PostMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void add(@PathVariable Long productId, @AuthenticationPrincipal UserDetails userDetails) {
        wishlistService.add(userDetails.getUsername(), productId);
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long productId, @AuthenticationPrincipal UserDetails userDetails) {
        wishlistService.remove(userDetails.getUsername(), productId);
    }
}
