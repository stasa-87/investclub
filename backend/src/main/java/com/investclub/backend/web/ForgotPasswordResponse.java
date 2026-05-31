package com.investclub.backend.web;

public record ForgotPasswordResponse(
    String message,
    String resetToken
) {
}
