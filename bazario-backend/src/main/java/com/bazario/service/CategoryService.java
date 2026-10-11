package com.bazario.service;

import com.bazario.dto.CategoryDto;
import com.bazario.entity.Category;
import com.bazario.repository.CategorieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategorieRepository repo;
    private final CloudinaryService cloudinaryService;
    private final ActivityLogService activityLogService;

    public List<CategoryDto.Response> getAll() {
        return repo.findAll().stream().map(this::toDto).toList();
    }

    public CategoryDto.Response create(CategoryDto.CreateRequest req) {
        String slug = toSlug(req.label());
        if (repo.existsBySlug(slug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Catégorie déjà existante");
        }
        Category saved = repo.save(Category.builder().slug(slug).label(req.label()).description(req.description()).build());
        activityLogService.log("Creation categorie", "Categorie creee: " + saved.getLabel());
        return toDto(saved);
    }

    public CategoryDto.Response update(Long id, CategoryDto.UpdateRequest req) {
        Category cat = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catégorie introuvable"));
        if (req.label()       != null && !req.label().isBlank()) cat.setLabel(req.label());
        if (req.imageUrl()    != null) cat.setImageUrl(req.imageUrl());
        if (req.description() != null) cat.setDescription(req.description());
        CategoryDto.Response dto = toDto(repo.save(cat));
        activityLogService.log("Modification categorie", "Categorie modifiee: " + cat.getLabel());
        return dto;
    }

    public CategoryDto.Response uploadImage(Long id, MultipartFile file) {
        Category cat = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catégorie introuvable"));
        String oldImageUrl = cat.getImageUrl();
        cat.setImageUrl(cloudinaryService.upload(file, "bazario/categories/" + id));
        if (oldImageUrl != null) cloudinaryService.delete(oldImageUrl);
        return toDto(repo.save(cat));
    }

    /** Deletes a category, detaching it from any products that reference it first. */
    @Transactional
    public void delete(Long id) {
        Category cat = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catégorie introuvable"));
        repo.unlinkFromProducts(id);
        repo.delete(cat);
        activityLogService.log("Suppression categorie", "Categorie supprimee: " + cat.getLabel());
    }

    private CategoryDto.Response toDto(Category c) {
        return new CategoryDto.Response(c.getId(), c.getSlug(), c.getLabel(), c.getImageUrl(), c.getDescription());
    }

    /** Converts a display label to an uppercase slug, e.g. "Câbles & Fils" → "CABLES_FILS" */
    public static String toSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        normalized = normalized.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        return normalized.toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
    }
}
