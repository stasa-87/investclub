package com.investclub.backend.web;

import java.sql.Timestamp;
import java.time.Instant;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class PasswordResetTokenRepository {
    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<PasswordResetTokenRecord> rowMapper = (rs, rowNum) -> new PasswordResetTokenRecord(
        rs.getLong("id"),
        rs.getLong("user_id"),
        rs.getString("token"),
        rs.getTimestamp("expires_at").toInstant(),
        rs.getTimestamp("used_at") == null ? null : rs.getTimestamp("used_at").toInstant()
    );

    public PasswordResetTokenRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public PasswordResetTokenRecord save(Long userId, String token, Instant expiresAt) {
        jdbcTemplate.update(
            "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
            userId,
            token,
            Timestamp.from(expiresAt)
        );

        return findByToken(token);
    }

    public PasswordResetTokenRecord findByToken(String token) {
        try {
            return jdbcTemplate.queryForObject(
                "SELECT id, user_id, token, expires_at, used_at FROM password_reset_tokens WHERE token = ?",
                rowMapper,
                token
            );
        } catch (EmptyResultDataAccessException exception) {
            return null;
        }
    }

    public void markAsUsed(String token) {
        jdbcTemplate.update(
            "UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ? AND used_at IS NULL",
            token
        );
    }

    public void invalidateAllByUserId(Long userId) {
        jdbcTemplate.update(
            "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
            userId
        );
    }

    public record PasswordResetTokenRecord(Long id, Long userId, String token, Instant expiresAt, Instant usedAt) {
    }
}
