package com.bazario.service;

import com.bazario.dto.CategoryDto;
import com.bazario.entity.Category;
import com.bazario.repository.CategorieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategorieRepository repo;

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    public List<CategoryDto.Response> getAll() {
        return repo.findAll().stream().map(this::toDto).toList();
    }

    public CategoryDto.Response create(CategoryDto.CreateRequest req) {
        String slug = toSlug(req.label());
        if (repo.existsBySlug(slug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Catégorie déjà existante");
        }
        Category saved = repo.save(Category.builder().slug(slug).label(req.label()).icon(req.icon()).build());
        return toDto(saved);
    }

    public CategoryDto.Response update(Long id, CategoryDto.UpdateRequest req) {
        Category cat = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catégorie introuvable"));
        if (req.label()    != null && !req.label().isBlank()) cat.setLabel(req.label());
        if (req.icon()     != null) cat.setIcon(req.icon());
        if (req.imageUrl() != null) cat.setImageUrl(req.imageUrl());
        return toDto(repo.save(cat));
    }

    public CategoryDto.Response uploadImage(Long id, MultipartFile file) {
        Category cat = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catégorie introuvable"));
        try {
            Path dir = Paths.get(uploadDir, "categories", String.valueOf(id)).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String ext = "";
            String orig = file.getOriginalFilename();
            if (orig != null && orig.contains(".")) ext = orig.substring(orig.lastIndexOf("."));
            String filename = UUID.randomUUID() + ext;
            Files.copy(file.getInputStream(), dir.resolve(filename));
            cat.setImageUrl("/uploads/categories/" + id + "/" + filename);
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'upload de l'image", e);
        }
        return toDto(repo.save(cat));
    }

    private CategoryDto.Response toDto(Category c) {
        return new CategoryDto.Response(c.getId(), c.getSlug(), c.getLabel(), c.getIcon(), c.getImageUrl());
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
