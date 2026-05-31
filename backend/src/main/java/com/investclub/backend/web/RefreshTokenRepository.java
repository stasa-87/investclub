package com.investclub.backend.web;

import java.sql.Timestamp;
import java.time.Instant;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class RefreshTokenRepository {
    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<RefreshTokenRecord> rowMapper = (rs, rowNum) -> new RefreshTokenRecord(
        rs.getLong("id"),
        rs.getLong("user_id"),
        rs.getString("token"),
        rs.getTimestamp("expires_at").toInstant(),
        rs.getTimestamp("revoked_at") == null ? null : rs.getTimestamp("revoked_at").toInstant()
    );

    public RefreshTokenRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public RefreshTokenRecord save(Long userId, String token, Instant expiresAt) {
        jdbcTemplate.update(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
            userId,
            token,
            Timestamp.from(expiresAt)
        );

        return findByToken(token);
    }

    public RefreshTokenRecord findByToken(String token) {
        try {
            return jdbcTemplate.queryForObject(
                "SELECT id, user_id, token, expires_at, revoked_at FROM refresh_tokens WHERE token = ?",
                rowMapper,
                token
            );
        } catch (EmptyResultDataAccessException exception) {
            return null;
        }
    }

    public void revokeByToken(String token) {
        jdbcTemplate.update(
            "UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = ? AND revoked_at IS NULL",
            token
        );
    }

    public void revokeAllByUserId(Long userId) {
        jdbcTemplate.update(
            "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL",
            userId
        );
    }

    public record RefreshTokenRecord(Long id, Long userId, String token, Instant expiresAt, Instant revokedAt) {
    }
}
