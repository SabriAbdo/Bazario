package com.bazario.repository;

import com.bazario.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategorieRepository extends JpaRepository<Category, Long> {
    boolean existsBySlug(String slug);
}
