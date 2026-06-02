package com.investclub.backend.web;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class TradeRepository {
    private final JdbcTemplate jdbcTemplate;

    public TradeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<TradePlaceholderRecord> tradeRowMapper = (rs, rowNum) -> mapTrade(rs);
    private final RowMapper<TradeExitRecord> exitRowMapper = (rs, rowNum) -> new TradeExitRecord(
        rs.getLong("id"),
        rs.getLong("trade_placeholder_id"),
        rs.getTimestamp("closed_at").toInstant().atOffset(ZoneOffset.UTC),
        rs.getBigDecimal("quantity"),
        rs.getBigDecimal("exit_price"),
        rs.getString("notes")
    );

    public TradePlaceholderRecord createTrade(Long userId, TradePlaceholderRequest request) {
        jdbcTemplate.update(
            """
            INSERT INTO trade_placeholders (
                user_id, opened_at, ticker, side, timeframe, strategy, status, currency,
                quantity, entry_price, stop_loss, take_profit, notes, be_threshold_percent
            ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?)
            """,
            userId,
            Timestamp.from(request.openedAt.toInstant()),
            request.ticker.trim().toUpperCase(),
            request.side.trim().toUpperCase(),
            request.timeframe.trim(),
            request.strategy.trim(),
            request.currency.trim().toUpperCase(),
            request.quantity,
            request.entryPrice,
            request.stopLoss,
            request.takeProfit,
            request.notes,
            request.beThresholdPercent
        );

        return jdbcTemplate.queryForObject(
            "SELECT * FROM trade_placeholders WHERE user_id = ? ORDER BY id DESC LIMIT 1",
            tradeRowMapper,
            userId
        );
    }

    // Filtering and pagination for trades
    public List<TradePlaceholderRecord> findFilteredByUserId(
            Long userId,
            String ticker,
            String status,
            String strategy,
            OffsetDateTime timeframeStart,
            OffsetDateTime timeframeEnd,
            int offset,
            int limit
    ) {
        StringBuilder sql = new StringBuilder("SELECT * FROM trade_placeholders WHERE user_id = ?");
        newLineIf(sql, ticker != null, " AND ticker = ?");
        newLineIf(sql, status != null, " AND status = ?");
        newLineIf(sql, strategy != null, " AND strategy = ?");
        newLineIf(sql, timeframeStart != null, " AND opened_at >= ?");
        newLineIf(sql, timeframeEnd != null, " AND opened_at <= ?");
        sql.append(" ORDER BY opened_at DESC, id DESC LIMIT ? OFFSET ?");

        List<Object> params = new java.util.ArrayList<>();
        params.add(userId);
        if (ticker != null) params.add(ticker);
        if (status != null) params.add(status);
        if (strategy != null) params.add(strategy);
        if (timeframeStart != null) params.add(java.sql.Timestamp.from(timeframeStart.toInstant()));
        if (timeframeEnd != null) params.add(java.sql.Timestamp.from(timeframeEnd.toInstant()));
        params.add(limit);
        params.add(offset);

        return jdbcTemplate.query(sql.toString(), tradeRowMapper, params.toArray());
    }

    public long countFilteredByUserId(
            Long userId,
            String ticker,
            String status,
            String strategy,
            OffsetDateTime timeframeStart,
            OffsetDateTime timeframeEnd
    ) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM trade_placeholders WHERE user_id = ?");
        newLineIf(sql, ticker != null, " AND ticker = ?");
        newLineIf(sql, status != null, " AND status = ?");
        newLineIf(sql, strategy != null, " AND strategy = ?");
        newLineIf(sql, timeframeStart != null, " AND opened_at >= ?");
        newLineIf(sql, timeframeEnd != null, " AND opened_at <= ?");

        List<Object> params = new java.util.ArrayList<>();
        params.add(userId);
        if (ticker != null) params.add(ticker);
        if (status != null) params.add(status);
        if (strategy != null) params.add(strategy);
        if (timeframeStart != null) params.add(java.sql.Timestamp.from(timeframeStart.toInstant()));
        if (timeframeEnd != null) params.add(java.sql.Timestamp.from(timeframeEnd.toInstant()));

        return jdbcTemplate.queryForObject(sql.toString(), Long.class, params.toArray());
    }

    private void newLineIf(StringBuilder sb, boolean cond, String sql) {
        if (cond) sb.append(sql);
    }

    public List<TradePlaceholderRecord> findAllByUserId(Long userId) {
        return jdbcTemplate.query(
            "SELECT * FROM trade_placeholders WHERE user_id = ? ORDER BY opened_at DESC, id DESC",
            tradeRowMapper,
            userId
        );
    }

    public TradePlaceholderRecord findByIdAndUserId(Long id, Long userId) {
        try {
            return jdbcTemplate.queryForObject(
                "SELECT * FROM trade_placeholders WHERE id = ? AND user_id = ?",
                tradeRowMapper,
                id,
                userId
            );
        } catch (EmptyResultDataAccessException exception) {
            return null;
        }
    }

    public TradeExitRecord addExit(Long tradeId, TradeExitRequest request) {
        jdbcTemplate.update(
            "INSERT INTO trade_exits (trade_placeholder_id, closed_at, quantity, exit_price, notes) VALUES (?, ?, ?, ?, ?)",
            tradeId,
            Timestamp.from(request.closedAt.toInstant()),
            request.quantity,
            request.exitPrice,
            request.notes
        );

        return jdbcTemplate.queryForObject(
            "SELECT * FROM trade_exits WHERE trade_placeholder_id = ? ORDER BY id DESC LIMIT 1",
            exitRowMapper,
            tradeId
        );
    }

    public List<TradeExitRecord> findExitsByTradeId(Long tradeId) {
        return jdbcTemplate.query(
            "SELECT * FROM trade_exits WHERE trade_placeholder_id = ? ORDER BY closed_at ASC, id ASC",
            exitRowMapper,
            tradeId
        );
    }

    public void updateComputedFields(Long tradeId, String status, BigDecimal computedRMultiple, OffsetDateTime closedAt) {
        jdbcTemplate.update(
            "UPDATE trade_placeholders SET status = ?, computed_r_multiple = ?, closed_at = ?, updated_at = NOW() WHERE id = ?",
            status,
            computedRMultiple,
            closedAt == null ? null : Timestamp.from(closedAt.toInstant()),
            tradeId
        );
    }

    public TradeStatsRecord fetchStats(Long userId) {
        return jdbcTemplate.queryForObject(
            """
            SELECT
                COUNT(*) AS total_placeholders,
                COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_count,
                COUNT(*) FILTER (WHERE status = 'WIN') AS win_count,
                COUNT(*) FILTER (WHERE status = 'LOSS') AS loss_count,
                COUNT(*) FILTER (WHERE status = 'BE') AS be_count,
                AVG(computed_r_multiple) FILTER (WHERE status IN ('WIN', 'LOSS')) AS average_r_multiple
            FROM trade_placeholders
            WHERE user_id = ?
            """,
            (rs, rowNum) -> new TradeStatsRecord(
                rs.getLong("total_placeholders"),
                rs.getLong("pending_count"),
                rs.getLong("win_count"),
                rs.getLong("loss_count"),
                rs.getLong("be_count"),
                rs.getBigDecimal("average_r_multiple")
            ),
            userId
        );
    }

    private TradePlaceholderRecord mapTrade(ResultSet rs) throws SQLException {
        Timestamp closedAt = rs.getTimestamp("closed_at");
        return new TradePlaceholderRecord(
            rs.getLong("id"),
            rs.getLong("user_id"),
            rs.getTimestamp("opened_at").toInstant().atOffset(ZoneOffset.UTC),
            rs.getString("ticker"),
            rs.getString("side"),
            rs.getString("timeframe"),
            rs.getString("strategy"),
            rs.getString("status"),
            rs.getString("currency"),
            rs.getBigDecimal("quantity"),
            rs.getBigDecimal("entry_price"),
            rs.getBigDecimal("stop_loss"),
            rs.getBigDecimal("take_profit"),
            rs.getString("notes"),
            rs.getBigDecimal("be_threshold_percent"),
            rs.getBigDecimal("computed_r_multiple"),
            closedAt == null ? null : closedAt.toInstant().atOffset(ZoneOffset.UTC)
        );
    }

    public record TradePlaceholderRecord(
        Long id,
        Long userId,
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
        OffsetDateTime closedAt
    ) {
    }

    public record TradeExitRecord(
        Long id,
        Long tradePlaceholderId,
        OffsetDateTime closedAt,
        BigDecimal quantity,
        BigDecimal exitPrice,
        String notes
    ) {
    }

    public record TradeStatsRecord(
        long totalPlaceholders,
        long pendingCount,
        long winCount,
        long lossCount,
        long breakEvenCount,
        BigDecimal averageRMultiple
    ) {
    }
}
