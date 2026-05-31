package com.investclub.backend.web;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record TradeExitDto(
    Long id,
    OffsetDateTime closedAt,
    BigDecimal quantity,
    BigDecimal exitPrice,
    String notes
) {
}
