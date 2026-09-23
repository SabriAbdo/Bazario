package com.bazario.repository;

import com.bazario.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop50ByOrderByIdDesc();

    long countByIdGreaterThan(Long id);
}
