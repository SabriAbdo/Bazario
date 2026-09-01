package com.bazario.controller;

import com.bazario.dto.ProductDto;
import com.bazario.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Page<ProductDto.Response>> getAll(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String categorie,
            @RequestParam(required = false) String marque,
            @RequestParam(required = false) BigDecimal minPrix,
            @RequestParam(required = false) BigDecimal maxPrix,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(productService.getProductsPaged(
                q, categorie, marque, minPrix, maxPrix, page, size, sort, sortDir));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('STOCK_OPERATEUR') or hasRole('ADMIN')")
    public ResponseEntity<ProductDto.Response> create(
            @Valid @RequestBody ProductDto.CreateRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.create(req, userDetails.getUsername()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STOCK_OPERATEUR') or hasRole('ADMIN')")
    public ResponseEntity<ProductDto.Response> update(
            @PathVariable Long id,
            @Valid @RequestBody ProductDto.UpdateRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(productService.update(id, req, userDetails.getUsername()));
    }

    @GetMapping("/deleted")
    @PreAuthorize("hasRole('STOCK_OPERATEUR') or hasRole('ADMIN')")
    public ResponseEntity<Page<ProductDto.Response>> getDeleted(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(productService.getDeletedProductsPaged(userDetails.getUsername(), page, size, sort, sortDir));
    }

    @PutMapping("/{id}/restore")
    @PreAuthorize("hasRole('STOCK_OPERATEUR') or hasRole('ADMIN')")
    public ResponseEntity<ProductDto.Response> restore(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(productService.restore(id, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STOCK_OPERATEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        productService.delete(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/images")
    @PreAuthorize("hasRole('STOCK_OPERATEUR') or hasRole('ADMIN')")
    public ResponseEntity<ProductDto.Response> uploadImages(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(productService.addImages(id, files, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}/images")
    @PreAuthorize("hasRole('STOCK_OPERATEUR') or hasRole('ADMIN')")
    public ResponseEntity<ProductDto.Response> deleteImage(
            @PathVariable Long id,
            @RequestParam String imageUrl,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(productService.deleteImage(id, imageUrl, userDetails.getUsername()));
    }

    @PostMapping("/{id}/variants")
    @PreAuthorize("hasRole('STOCK_OPERATEUR') or hasRole('ADMIN')")
    public ResponseEntity<ProductDto.Response> addVariant(
            @PathVariable Long id,
            @Valid @RequestBody ProductDto.VariantRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.addVariant(id, req, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}/variants/{variantId}")
    @PreAuthorize("hasRole('STOCK_OPERATEUR') or hasRole('ADMIN')")
    public ResponseEntity<ProductDto.Response> deleteVariant(
            @PathVariable Long id,
            @PathVariable Long variantId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(productService.deleteVariant(id, variantId, userDetails.getUsername()));
    }

    @GetMapping("/mes-produits")
    @PreAuthorize("hasRole('STOCK_OPERATEUR') or hasRole('ADMIN')")
    public ResponseEntity<Page<ProductDto.Response>> myProducts(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(productService.getProductsByCreator(userDetails.getUsername(), page, size, sort, sortDir, q));
    }
}
