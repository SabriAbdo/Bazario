package com.bazario.controller;

import com.bazario.dto.CommentDto;
import com.bazario.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /** Public — anyone can read comments */
    @GetMapping("/api/v1/products/{productId}/comments")
    public ResponseEntity<List<CommentDto.Response>> getByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(commentService.getByProduct(productId));
    }

    /**
     * Public — visitors and admins can post.
     * If the caller is authenticated as ADMIN, the comment is flagged accordingly.
     */
    @PostMapping("/api/v1/products/{productId}/comments")
    public ResponseEntity<CommentDto.Response> add(
            @PathVariable Long productId,
            @Valid @RequestBody CommentDto.AddRequest req,
            Authentication auth) {
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.add(productId, req, isAdmin));
    }

    /** Admin only — delete any comment */
    @DeleteMapping("/api/v1/comments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        commentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
