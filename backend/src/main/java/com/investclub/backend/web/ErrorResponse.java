package com.investclub.backend.web;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(
    String message,
    Map<String, String> fieldErrors,
    Instant timestamp
) {
}
