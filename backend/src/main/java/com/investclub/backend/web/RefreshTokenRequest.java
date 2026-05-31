package com.investclub.backend.web;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public class RefreshTokenRequest {
    @Schema(example = "refresh-token-value")
    @NotBlank(message = "Refresh token is required")
    public String refreshToken;
}
