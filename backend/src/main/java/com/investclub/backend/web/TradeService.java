package com.investclub.backend.web;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class TradeService {
    private static final MathContext MATH_CONTEXT = new MathContext(12, RoundingMode.HALF_UP);
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final TradeRepository tradeRepository;
    private final UserRepository userRepository;

    public TradeService(TradeRepository tradeRepository, UserRepository userRepository) {
        this.tradeRepository = tradeRepository;
        this.userRepository = userRepository;
    }

    public TradePlaceholderDto createTrade(String username, TradePlaceholderRequest request) {
        validateTradeRequest(request);
        Long userId = requireUserId(username);
        TradeRepository.TradePlaceholderRecord record = tradeRepository.createTrade(userId, request);
        return toDto(record, List.of());
    }

    public PaginatedTradesDto listTrades(
            String username,
            String ticker,
            String status,
            String strategy,
            OffsetDateTime timeframeStart,
            OffsetDateTime timeframeEnd,
            int page,
            int perPage
    ) {
        Long userId = requireUserId(username);
        int safePage = Math.max(page, 1);
        int safePerPage = Math.max(Math.min(perPage, 100), 1);
        int offset = (safePage - 1) * safePerPage;
        List<TradeRepository.TradePlaceholderRecord> records = tradeRepository.findFilteredByUserId(
                userId, ticker, status, strategy, timeframeStart, timeframeEnd, offset, safePerPage);
        long total = tradeRepository.countFilteredByUserId(
                userId, ticker, status, strategy, timeframeStart, timeframeEnd);
        List<TradePlaceholderDto> data = records.stream()
                .map(record -> toDto(record, tradeRepository.findExitsByTradeId(record.id())))
                .toList();
        return new PaginatedTradesDto(data, total, safePage, safePerPage);
    }

    public TradePlaceholderDto getTrade(String username, Long tradeId) {
        Long userId = requireUserId(username);
        TradeRepository.TradePlaceholderRecord record = tradeRepository.findByIdAndUserId(tradeId, userId);
        if (record == null) {
            throw new IllegalArgumentException("Trade placeholder not found");
        }
        return toDto(record, tradeRepository.findExitsByTradeId(record.id()));
    }

    public TradePlaceholderDto addExit(String username, Long tradeId, TradeExitRequest request) {
        Long userId = requireUserId(username);
        TradeRepository.TradePlaceholderRecord trade = tradeRepository.findByIdAndUserId(tradeId, userId);
        if (trade == null) {
            throw new IllegalArgumentException("Trade placeholder not found");
        }
        if (!"PENDING".equals(trade.status())) {
            throw new IllegalArgumentException("Cannot add exit to a closed trade placeholder");
        }

        List<TradeRepository.TradeExitRecord> currentExits = tradeRepository.findExitsByTradeId(tradeId);
        BigDecimal currentExitedQuantity = sumExitQuantity(currentExits);
        BigDecimal nextExitedQuantity = currentExitedQuantity.add(request.quantity);
        if (nextExitedQuantity.compareTo(trade.quantity()) > 0) {
            throw new IllegalArgumentException("Exit quantity exceeds remaining placeholder quantity");
        }

        tradeRepository.addExit(tradeId, request);
        List<TradeRepository.TradeExitRecord> allExits = tradeRepository.findExitsByTradeId(tradeId);
        recalculateTrade(trade, allExits);
        return getTrade(username, tradeId);
    }

    public TradeStatsDto getStats(String username) {
        Long userId = requireUserId(username);
        TradeRepository.TradeStatsRecord stats = tradeRepository.fetchStats(userId);
        BigDecimal denominator = BigDecimal.valueOf(stats.winCount() + stats.lossCount());
        BigDecimal winRate = denominator.signum() == 0
            ? BigDecimal.ZERO
            : BigDecimal.valueOf(stats.winCount()).divide(denominator, 4, RoundingMode.HALF_UP);

        return new TradeStatsDto(
            stats.totalPlaceholders(),
            stats.pendingCount(),
            stats.winCount(),
            stats.lossCount(),
            stats.breakEvenCount(),
            winRate,
            stats.averageRMultiple() == null ? BigDecimal.ZERO : stats.averageRMultiple().setScale(4, RoundingMode.HALF_UP)
        );
    }

    private void recalculateTrade(
        TradeRepository.TradePlaceholderRecord trade,
        List<TradeRepository.TradeExitRecord> exits
    ) {
        BigDecimal exitedQuantity = sumExitQuantity(exits);
        if (exitedQuantity.compareTo(trade.quantity()) < 0) {
            tradeRepository.updateComputedFields(trade.id(), "PENDING", null, null);
            return;
        }

        BigDecimal weightedAverageExitPrice = weightedAverageExitPrice(exits);
        BigDecimal rValue = trade.entryPrice().subtract(trade.stopLoss()).abs();
        if (rValue.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException("Entry price and stop loss cannot be equal");
        }

        BigDecimal pnl = signedPriceDifference(trade.side(), trade.entryPrice(), weightedAverageExitPrice);
        BigDecimal rMultiple = pnl.divide(rValue, 8, RoundingMode.HALF_UP);
        BigDecimal beDistance = trade.entryPrice()
            .multiply(trade.beThresholdPercent(), MATH_CONTEXT)
            .divide(HUNDRED, 8, RoundingMode.HALF_UP);
        BigDecimal absPnl = weightedAverageExitPrice.subtract(trade.entryPrice()).abs();

        String status;
        if (absPnl.compareTo(beDistance) <= 0) {
            status = "BE";
        } else if (pnl.compareTo(BigDecimal.ZERO) > 0) {
            status = "WIN";
        } else {
            status = "LOSS";
        }

        OffsetDateTime closedAt = exits.stream()
            .map(TradeRepository.TradeExitRecord::closedAt)
            .max(OffsetDateTime::compareTo)
            .orElse(trade.openedAt());

        tradeRepository.updateComputedFields(trade.id(), status, rMultiple, closedAt);
    }

    private TradePlaceholderDto toDto(
        TradeRepository.TradePlaceholderRecord record,
        List<TradeRepository.TradeExitRecord> exits
    ) {
        BigDecimal exitedQuantity = sumExitQuantity(exits);
        BigDecimal remainingQuantity = record.quantity().subtract(exitedQuantity).max(BigDecimal.ZERO);
        BigDecimal weightedAverageExitPrice = exits.isEmpty() ? null : weightedAverageExitPrice(exits);

        return new TradePlaceholderDto(
            record.id(),
            record.openedAt(),
            record.ticker(),
            record.side(),
            record.timeframe(),
            record.strategy(),
            record.status(),
            record.currency(),
            record.quantity(),
            record.entryPrice(),
            record.stopLoss(),
            record.takeProfit(),
            record.notes(),
            record.beThresholdPercent(),
            record.computedRMultiple(),
            record.closedAt(),
            exitedQuantity,
            remainingQuantity,
            weightedAverageExitPrice,
            exits.stream().map(exit -> new TradeExitDto(
                exit.id(),
                exit.closedAt(),
                exit.quantity(),
                exit.exitPrice(),
                exit.notes()
            )).toList()
        );
    }

    private void validateTradeRequest(TradePlaceholderRequest request) {
        String side = request.side.trim().toUpperCase();
        if (!side.equals("BUY") && !side.equals("SELL")) {
            throw new IllegalArgumentException("Side must be BUY or SELL");
        }
        if (request.entryPrice.compareTo(request.stopLoss) == 0) {
            throw new IllegalArgumentException("Entry price and stop loss must be different");
        }
    }

    private BigDecimal signedPriceDifference(String side, BigDecimal entryPrice, BigDecimal exitPrice) {
        if ("SELL".equalsIgnoreCase(side)) {
            return entryPrice.subtract(exitPrice);
        }
        return exitPrice.subtract(entryPrice);
    }

    private BigDecimal weightedAverageExitPrice(List<TradeRepository.TradeExitRecord> exits) {
        BigDecimal totalQuantity = BigDecimal.ZERO;
        BigDecimal totalValue = BigDecimal.ZERO;

        for (TradeRepository.TradeExitRecord exit : exits) {
            totalQuantity = totalQuantity.add(exit.quantity());
            totalValue = totalValue.add(exit.exitPrice().multiply(exit.quantity(), MATH_CONTEXT));
        }

        return totalValue.divide(totalQuantity, 8, RoundingMode.HALF_UP);
    }

    private BigDecimal sumExitQuantity(List<TradeRepository.TradeExitRecord> exits) {
        return exits.stream()
            .map(TradeRepository.TradeExitRecord::quantity)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Long requireUserId(String username) {
        UserRepository.UserRecord user = userRepository.findByUsernameOrEmail(username);
        if (user == null) {
            throw new IllegalStateException("User not found");
        }
        return user.id();
    }
}
