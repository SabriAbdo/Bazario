package com.bazario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class CommentDto {

    public record AddRequest(
            @NotBlank @Size(max = 100) String authorName,
            @NotBlank @Size(max = 1000) String content
    ) {}

    public record Response(
            Long id,
            Long productId,
            String authorName,
            String content,
            boolean admin,
            LocalDateTime createdAt
    ) {}
}
