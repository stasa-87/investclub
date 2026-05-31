package com.investclub.backend.web;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @Schema(example = "stan")
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username may contain only letters, numbers, dots, underscores and dashes")
    public String username;

    @Schema(example = "stan@example.com")
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    public String email;

    @Schema(example = "Secret123!", minLength = 8)
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    public String password;

    @Schema(example = "https://example.com/avatar.png")
    public String profilePhotoUrl;
}
