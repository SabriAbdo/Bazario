package com.bazario.repository;

import com.bazario.entity.ProductLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductLikeRepository extends JpaRepository<ProductLike, Long> {
    boolean existsByUser_UsernameAndProduct_Id(String username, Long productId);

    void deleteByUser_UsernameAndProduct_Id(String username, Long productId);

    @Query("SELECT l.product.id FROM ProductLike l WHERE l.user.username = :username")
    List<Long> findProductIdsByUsername(String username);
}
