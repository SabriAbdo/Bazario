package com.bazario.repository;

import com.bazario.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface CategorieRepository extends JpaRepository<Category, Long> {
    boolean existsBySlug(String slug);

    List<Category> findBySlugIn(Collection<String> slugs);

    /** Removes all product↔category links for this category so it can be deleted even if products reference it. */
    @Modifying
    @Query(value = "DELETE FROM product_category_link WHERE category_id = :categoryId", nativeQuery = true)
    void unlinkFromProducts(@Param("categoryId") Long categoryId);
}
