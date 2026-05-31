package com.investclub.backend.web;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {
    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<UserRecord> rowMapper = (rs, rowNum) -> new UserRecord(
        rs.getLong("id"),
        rs.getString("username"),
        rs.getString("email"),
        rs.getString("password_hash"),
        rs.getString("profile_photo_url")
    );

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public UserRecord findByUsernameOrEmail(String usernameOrEmail) {
        try {
            return jdbcTemplate.queryForObject(
                "SELECT * FROM users WHERE username = ? OR email = ?",
                rowMapper,
                usernameOrEmail, usernameOrEmail
            );
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public UserRecord findByEmail(String email) {
        try {
            return jdbcTemplate.queryForObject(
                "SELECT * FROM users WHERE email = ?",
                rowMapper,
                email
            );
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public UserRecord findById(Long id) {
        try {
            return jdbcTemplate.queryForObject(
                "SELECT * FROM users WHERE id = ?",
                rowMapper,
                id
            );
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public boolean existsByUsername(String username) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE username = ?",
            Integer.class,
            username
        );
        return count != null && count > 0;
    }

    public boolean existsByEmail(String email) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE email = ?",
            Integer.class,
            email
        );
        return count != null && count > 0;
    }

    public UserRecord save(String username, String email, String passwordHash, String profilePhotoUrl) {
        jdbcTemplate.update(
            "INSERT INTO users (username, email, password_hash, profile_photo_url) VALUES (?, ?, ?, ?)",
            username, email, passwordHash, profilePhotoUrl
        );
        return findByUsernameOrEmail(username);
    }

    public void updatePassword(Long userId, String passwordHash) {
        jdbcTemplate.update(
            "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
            passwordHash,
            userId
        );
    }

    public void updateProfilePhotoUrl(Long userId, String profilePhotoUrl) {
        jdbcTemplate.update(
            "UPDATE users SET profile_photo_url = ?, updated_at = NOW() WHERE id = ?",
            profilePhotoUrl,
            userId
        );
    }

    public record UserRecord(Long id, String username, String email, String passwordHash, String profilePhotoUrl) {}
}
