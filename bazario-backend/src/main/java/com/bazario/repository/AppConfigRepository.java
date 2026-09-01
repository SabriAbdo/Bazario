package com.bazario.repository;

import com.bazario.entity.AppConfig;
import com.bazario.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppConfigRepository extends JpaRepository<AppConfig, Long> {
    List<AppConfig> findTop50ByOrderByCreatedAtDesc();
    List<AppConfig> findByUserOrderByCreatedAtDesc(User user);
}
