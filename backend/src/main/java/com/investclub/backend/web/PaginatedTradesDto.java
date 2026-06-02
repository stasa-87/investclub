package com.investclub.backend.web;

import java.util.List;

public record PaginatedTradesDto(
    List<TradePlaceholderDto> data,
    long total,
    int page,
    int perPage
) {}
