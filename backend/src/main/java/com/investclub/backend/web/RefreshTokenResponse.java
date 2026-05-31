package com.investclub.backend.web;

public record RefreshTokenResponse(
    String token,
    String refreshToken,
    UserDto user
) {
}
