package com.bazario.service;

import com.bazario.dto.CommentDto;
import com.bazario.entity.Comment;
import com.bazario.entity.Product;
import com.bazario.exception.ResourceNotFoundException;
import com.bazario.repository.CommentRepository;
import com.bazario.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final ProductRepository productRepository;

    public List<CommentDto.Response> getByProduct(Long productId) {
        return commentRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public CommentDto.Response add(Long productId, CommentDto.AddRequest req, boolean isAdmin) {
        Product product = productRepository.findById(productId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable"));

        Comment comment = Comment.builder()
                .product(product)
                .authorName(req.authorName())
                .content(req.content())
                .admin(isAdmin)
                .build();

        return toDto(commentRepository.save(comment));
    }

    @Transactional
    public void delete(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new ResourceNotFoundException("Commentaire introuvable");
        }
        commentRepository.deleteById(commentId);
    }

    private CommentDto.Response toDto(Comment c) {
        return new CommentDto.Response(
                c.getId(),
                c.getProduct().getId(),
                c.getAuthorName(),
                c.getContent(),
                c.isAdmin(),
                c.getCreatedAt()
        );
    }
}
