package com.investclub.backend.web;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class StorageService {
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final Path uploadDir;
    private final String publicBaseUrl;

    public StorageService(
        @Value("${app.upload-dir}") String uploadDir,
        @Value("${app.public-base-url}") String publicBaseUrl
    ) throws IOException {
        this.uploadDir = Path.of(uploadDir).resolve("profile-photos");
        this.publicBaseUrl = publicBaseUrl;
        Files.createDirectories(this.uploadDir);
    }

    public String storeProfilePhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Profile photo file is required");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Profile photo must be a JPG, PNG or WEBP image");
        }

        String extension = extractExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + extension;
        Path destination = uploadDir.resolve(filename);

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to store profile photo", exception);
        }

        return publicBaseUrl + "/uploads/profile-photos/" + filename;
    }

    public void deleteProfilePhoto(String profilePhotoUrl) {
        if (profilePhotoUrl == null || profilePhotoUrl.isBlank()) {
            return;
        }

        String managedPrefix = publicBaseUrl + "/uploads/profile-photos/";
        if (!profilePhotoUrl.startsWith(managedPrefix)) {
            return;
        }

        String filename = profilePhotoUrl.substring(managedPrefix.length());
        if (filename.contains("/") || filename.contains("\\") || filename.isBlank()) {
            return;
        }

        Path filePath = uploadDir.resolve(filename).normalize();
        if (!Objects.equals(filePath.getParent(), uploadDir.normalize())) {
            return;
        }

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to delete previous profile photo", exception);
        }
    }

    private String extractExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            return ".bin";
        }

        return originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase();
    }
}
