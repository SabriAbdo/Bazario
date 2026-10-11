package com.bazario.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Uploads/deletes images on Cloudinary, replacing the old local-disk storage under {@code uploads/}. */
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private static final Pattern PUBLIC_ID_PATTERN = Pattern.compile("/upload/(?:v\\d+/)?(.+)\\.[a-zA-Z0-9]+$");

    private final Cloudinary cloudinary;

    /** Uploads a file under the given folder (e.g. "bazario/products/12") and returns its public HTTPS URL. */
    public String upload(MultipartFile file, String folder) {
        Object cloudName = cloudinary.config.cloudName;
        if (cloudName == null || cloudName.toString().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Le service d'upload d'images n'est pas configuré (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET manquants)");
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image"));
            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'upload de l'image vers Cloudinary", e);
        }
    }

    /** Deletes the image identified by its Cloudinary URL, ignoring URLs it doesn't recognize. */
    public void delete(String url) {
        if (url == null) return;
        Matcher matcher = PUBLIC_ID_PATTERN.matcher(url);
        if (!matcher.find()) return;
        String publicId = matcher.group(1);
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException ignored) {}
    }
}
