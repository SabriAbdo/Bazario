package com.bazario.service;

import com.bazario.entity.Product;
import com.bazario.entity.ProductLike;
import com.bazario.entity.User;
import com.bazario.exception.ResourceNotFoundException;
import com.bazario.repository.ProductLikeRepository;
import com.bazario.repository.ProductRepository;
import com.bazario.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductLikeService {

    private final ProductLikeRepository productLikeRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<Long> getMyLikedProductIds(String username) {
        return productLikeRepository.findProductIdsByUsername(username);
    }

    @Transactional
    public int like(String username, Long productId) {
        Product product = productRepository.findById(productId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        if (!productLikeRepository.existsByUser_UsernameAndProduct_Id(username, productId)) {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
            productLikeRepository.save(ProductLike.builder().user(user).product(product).build());
            product.setLikesCount(product.getLikesCount() + 1);
            productRepository.save(product);
        }
        return product.getLikesCount();
    }

    @Transactional
    public int unlike(String username, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        if (productLikeRepository.existsByUser_UsernameAndProduct_Id(username, productId)) {
            productLikeRepository.deleteByUser_UsernameAndProduct_Id(username, productId);
            product.setLikesCount(Math.max(0, product.getLikesCount() - 1));
            productRepository.save(product);
        }
        return product.getLikesCount();
    }
}
