package com.investclub.backend.web;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class TradeExitRequest {
    @NotNull(message = "Closed at is required")
    public OffsetDateTime closedAt;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    public BigDecimal quantity;

    @NotNull(message = "Exit price is required")
    @DecimalMin(value = "0.00000001", message = "Exit price must be positive")
    public BigDecimal exitPrice;

    public String notes;
}
