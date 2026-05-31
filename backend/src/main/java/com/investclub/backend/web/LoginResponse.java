package com.investclub.backend.web;

public record LoginResponse(
    String token,
    String refreshToken,
    UserDto user
) {
}
