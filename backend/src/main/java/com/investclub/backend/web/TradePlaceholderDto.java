package com.investclub.backend.web;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record TradePlaceholderDto(
    Long id,
    OffsetDateTime openedAt,
    String ticker,
    String side,
    String timeframe,
    String strategy,
    String status,
    String currency,
    BigDecimal quantity,
    BigDecimal entryPrice,
    BigDecimal stopLoss,
    BigDecimal takeProfit,
    String notes,
    BigDecimal beThresholdPercent,
    BigDecimal computedRMultiple,
    OffsetDateTime closedAt,
    BigDecimal exitedQuantity,
    BigDecimal remainingQuantity,
    BigDecimal weightedAverageExitPrice,
    List<TradeExitDto> exits
) {
}
