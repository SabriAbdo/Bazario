package com.bazario.service;

import com.bazario.dto.NotificationDto;
import com.bazario.entity.Notification;
import com.bazario.entity.Order;
import com.bazario.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void notifyNewOrder(Order order) {
        boolean isDemandeInfo = order.getType() == Order.OrderType.DEMANDE_INFO;
        Notification notification = Notification.builder()
                .type(isDemandeInfo ? Notification.NotificationType.NEW_DEMANDE_INFO : Notification.NotificationType.NEW_COMMANDE)
                .message((isDemandeInfo ? "Nouvelle demande d'information de " : "Nouvelle commande de ") + order.getNom() + " " + order.getPrenom())
                .orderId(order.getId())
                .build();
        notificationRepository.save(notification);
    }

    public List<NotificationDto.Response> getRecent() {
        return notificationRepository.findTop50ByOrderByIdDesc().stream()
                .map(this::toDto)
                .toList();
    }

    public NotificationDto.CountResponse countSince(Long sinceId) {
        long id = sinceId == null ? 0L : sinceId;
        return new NotificationDto.CountResponse(notificationRepository.countByIdGreaterThan(id));
    }

    private NotificationDto.Response toDto(Notification n) {
        return new NotificationDto.Response(n.getId(), n.getType().name(), n.getMessage(), n.getOrderId(), n.getCreatedAt());
    }
}
