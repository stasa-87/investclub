package com.investclub.backend.web;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ResetPasswordRequest {
    @Schema(example = "reset-token-value")
    @NotBlank(message = "Reset token is required")
    public String token;

    @Schema(example = "NewSecret123!", minLength = 8)
    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 100, message = "New password must be between 8 and 100 characters")
    public String newPassword;
}
