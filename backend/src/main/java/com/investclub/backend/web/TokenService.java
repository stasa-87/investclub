package com.investclub.backend.web;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();
    private final long refreshExpiration;

    public TokenService(
        RefreshTokenRepository refreshTokenRepository,
        PasswordResetTokenRepository passwordResetTokenRepository,
        @Value("${jwt.refresh-expiration}") long refreshExpiration
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.refreshExpiration = refreshExpiration;
    }

    public RefreshTokenRepository.RefreshTokenRecord createRefreshToken(Long userId) {
        String token = randomToken();
        Instant expiresAt = Instant.now().plusMillis(refreshExpiration);
        return refreshTokenRepository.save(userId, token, expiresAt);
    }

    public RefreshTokenRepository.RefreshTokenRecord rotateRefreshToken(String token) {
        RefreshTokenRepository.RefreshTokenRecord existing = refreshTokenRepository.findByToken(token);
        if (existing == null || existing.revokedAt() != null || existing.expiresAt().isBefore(Instant.now())) {
            throw new IllegalStateException("Refresh token is invalid or expired");
        }

        refreshTokenRepository.revokeByToken(token);
        return createRefreshToken(existing.userId());
    }

    public void revokeRefreshToken(String token) {
        RefreshTokenRepository.RefreshTokenRecord existing = refreshTokenRepository.findByToken(token);
        if (existing == null || existing.revokedAt() != null || existing.expiresAt().isBefore(Instant.now())) {
            throw new IllegalStateException("Refresh token is invalid or expired");
        }

        refreshTokenRepository.revokeByToken(token);
    }

    public PasswordResetTokenRepository.PasswordResetTokenRecord createPasswordResetToken(Long userId) {
        passwordResetTokenRepository.invalidateAllByUserId(userId);
        return passwordResetTokenRepository.save(userId, randomToken(), Instant.now().plusSeconds(3600));
    }

    public void revokeAllRefreshTokens(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    public PasswordResetTokenRepository.PasswordResetTokenRecord validatePasswordResetToken(String token) {
        PasswordResetTokenRepository.PasswordResetTokenRecord record = passwordResetTokenRepository.findByToken(token);
        if (record == null || record.usedAt() != null || record.expiresAt().isBefore(Instant.now())) {
            throw new IllegalStateException("Reset token is invalid or expired");
        }
        return record;
    }

    public void markPasswordResetTokenUsed(String token) {
        passwordResetTokenRepository.markAsUsed(token);
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
