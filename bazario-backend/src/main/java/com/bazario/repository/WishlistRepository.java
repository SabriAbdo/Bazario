package com.bazario.repository;

import com.bazario.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findByUser_UsernameOrderByAddedAtDesc(String username);

    Optional<WishlistItem> findByUser_UsernameAndProduct_Id(String username, Long productId);

    boolean existsByUser_UsernameAndProduct_Id(String username, Long productId);

    void deleteByUser_UsernameAndProduct_Id(String username, Long productId);
}
