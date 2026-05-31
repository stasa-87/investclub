package com.investclub.backend.web;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class TradePlaceholderRequest {
    @NotNull(message = "Opened at is required")
    public OffsetDateTime openedAt;

    @NotBlank(message = "Ticker is required")
    @Schema(example = "DAX")
    public String ticker;

    @NotBlank(message = "Side is required")
    @Schema(example = "BUY")
    public String side;

    @NotBlank(message = "Timeframe is required")
    @Schema(example = "1h")
    public String timeframe;

    @NotBlank(message = "Strategy is required")
    @Schema(example = "breakout")
    public String strategy;

    @NotBlank(message = "Currency is required")
    @Schema(example = "USD")
    public String currency;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    public BigDecimal quantity;

    @NotNull(message = "Entry price is required")
    @DecimalMin(value = "0.00000001", message = "Entry price must be positive")
    public BigDecimal entryPrice;

    @NotNull(message = "Stop loss is required")
    @DecimalMin(value = "0.00000001", message = "Stop loss must be positive")
    public BigDecimal stopLoss;

    @DecimalMin(value = "0.00000001", message = "Take profit must be positive")
    public BigDecimal takeProfit;

    public String notes;

    @NotNull(message = "BE threshold percent is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "BE threshold percent must be zero or positive")
    @Schema(example = "1.0")
    public BigDecimal beThresholdPercent;
}
