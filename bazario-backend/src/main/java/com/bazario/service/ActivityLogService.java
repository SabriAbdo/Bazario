package com.bazario.service;

import com.bazario.dto.AdminDto;
import com.bazario.entity.AppConfig;
import com.bazario.entity.User;
import com.bazario.repository.AppConfigRepository;
import com.bazario.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;

/** Records actions taken by staff (Admin/Operateur/Stock operateur); Client and anonymous Visiteur actions are never logged. */
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final AppConfigRepository activityLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void log(String action, String details) {
        User user = currentStaffUser();
        if (user == null) return;
        AppConfig entry = AppConfig.builder().user(user).action(action).details(details).build();
        activityLogRepository.save(entry);
    }

    public List<AdminDto.ActivityLogResponse> getLogs() {
        return activityLogRepository.findTop50ByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    /** Resolves the currently authenticated user, or null if anonymous/Client (not tracked). */
    private User currentStaffUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        return (user != null && user.getRole() != User.Role.CLIENT) ? user : null;
    }

    private AdminDto.ActivityLogResponse toDto(AppConfig log) {
        return new AdminDto.ActivityLogResponse(
                log.getId(),
                log.getUser() != null ? log.getUser().getId() : null,
                log.getUser() != null ? log.getUser().getFullName() : "Systeme",
                log.getAction(),
                log.getDetails(),
                log.getCreatedAt() != null ? log.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
    }
}
