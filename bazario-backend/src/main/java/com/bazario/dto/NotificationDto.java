package com.bazario.dto;

import java.time.LocalDateTime;

public class NotificationDto {

    public record Response(
            Long id,
            String type,
            String message,
            Long orderId,
            LocalDateTime createdAt
    ) {}

    public record CountResponse(long count) {}
}
