package com.bazario.controller;

import com.bazario.dto.CategoryDto;
import com.bazario.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService service;

    @GetMapping
    public List<CategoryDto.Response> getAll() {
        return service.getAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STOCK_OPERATEUR')")
    public ResponseEntity<CategoryDto.Response> create(@Valid @RequestBody CategoryDto.CreateRequest req) {
        return ResponseEntity.status(201).body(service.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STOCK_OPERATEUR')")
    public CategoryDto.Response update(@PathVariable Long id,
                                       @Valid @RequestBody CategoryDto.UpdateRequest req) {
        return service.update(id, req);
    }

    @PostMapping("/{id}/image")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STOCK_OPERATEUR')")
    public ResponseEntity<CategoryDto.Response> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(service.uploadImage(id, file));
    }
}
