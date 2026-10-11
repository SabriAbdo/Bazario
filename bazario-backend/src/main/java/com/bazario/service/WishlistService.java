package com.bazario.service;

import com.bazario.dto.WishlistDto;
import com.bazario.entity.Product;
import com.bazario.entity.User;
import com.bazario.entity.WishlistItem;
import com.bazario.exception.ResourceNotFoundException;
import com.bazario.repository.ProductRepository;
import com.bazario.repository.UserRepository;
import com.bazario.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<WishlistDto.Item> getWishlist(String username) {
        return wishlistRepository.findByUser_UsernameOrderByAddedAtDesc(username).stream()
                .map(w -> new WishlistDto.Item(w.getProduct().getId()))
                .toList();
    }

    @Transactional
    public void add(String username, Long productId) {
        if (wishlistRepository.existsByUser_UsernameAndProduct_Id(username, productId)) {
            return;
        }
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        Product product = productRepository.findById(productId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));
        wishlistRepository.save(WishlistItem.builder().user(user).product(product).build());
    }

    @Transactional
    public void remove(String username, Long productId) {
        wishlistRepository.deleteByUser_UsernameAndProduct_Id(username, productId);
    }
}
