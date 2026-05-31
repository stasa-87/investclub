package com.investclub.backend.web;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
    @Schema(example = "stan@example.com")
    @NotBlank(message = "Username or email is required")
    public String usernameOrEmail;

    @Schema(example = "Secret123!", minLength = 8)
    @NotBlank(message = "Password is required")
    public String password;
}
