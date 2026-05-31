package com.investclub.backend.web;

import java.math.BigDecimal;

public record TradeStatsDto(
    long totalPlaceholders,
    long pendingCount,
    long winCount,
    long lossCount,
    long breakEvenCount,
    BigDecimal winRate,
    BigDecimal averageRMultiple
) {
}
