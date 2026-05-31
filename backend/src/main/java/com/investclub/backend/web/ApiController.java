package com.investclub.backend.web;

import java.util.Map;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api")
@Tag(name = "API", description = "General and demo endpoints")
public class ApiController {

    private final JdbcTemplate jdbcTemplate;

    public ApiController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Operation(summary = "Health check", description = "Returns backend and database status.")
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);

            return ResponseEntity.ok(Map.of(
                "status", "UP",
                "database", "UP"
            ));
        } catch (DataAccessException exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "status", "DOWN",
                "database", "DOWN"
            ));
        }
    }

    @Operation(summary = "Demo endpoint", description = "Returns a demo response for frontend connection test.")
    @GetMapping("/demo")
    public DemoResponse demo() {
        return new DemoResponse(
            "Spring Boot backend is connected and ready for the frontend.",
            "backend",
            "READY"
        );
    }

    public record DemoResponse(String message, String service, String status) {
    }
}
