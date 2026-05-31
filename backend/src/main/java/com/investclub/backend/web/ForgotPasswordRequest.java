package com.investclub.backend.web;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ForgotPasswordRequest {
    @Schema(example = "stan@example.com")
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    public String email;
}
