CREATE TABLE IF NOT EXISTS trade_placeholders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opened_at TIMESTAMPTZ NOT NULL,
    ticker VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    timeframe VARCHAR(20) NOT NULL,
    strategy VARCHAR(50) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('WIN', 'LOSS', 'BE', 'PENDING')),
    currency VARCHAR(10) NOT NULL,
    quantity NUMERIC(20, 8) NOT NULL CHECK (quantity > 0),
    entry_price NUMERIC(20, 8) NOT NULL CHECK (entry_price > 0),
    stop_loss NUMERIC(20, 8) NOT NULL CHECK (stop_loss > 0),
    take_profit NUMERIC(20, 8),
    notes TEXT,
    be_threshold_percent NUMERIC(10, 4) NOT NULL CHECK (be_threshold_percent >= 0),
    computed_r_multiple NUMERIC(20, 8),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_placeholders_user_id ON trade_placeholders(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_placeholders_opened_at ON trade_placeholders(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_placeholders_status ON trade_placeholders(status);
CREATE INDEX IF NOT EXISTS idx_trade_placeholders_ticker ON trade_placeholders(ticker);

CREATE TABLE IF NOT EXISTS trade_exits (
    id SERIAL PRIMARY KEY,
    trade_placeholder_id INTEGER NOT NULL REFERENCES trade_placeholders(id) ON DELETE CASCADE,
    closed_at TIMESTAMPTZ NOT NULL,
    quantity NUMERIC(20, 8) NOT NULL CHECK (quantity > 0),
    exit_price NUMERIC(20, 8) NOT NULL CHECK (exit_price > 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_exits_placeholder_id ON trade_exits(trade_placeholder_id);
CREATE INDEX IF NOT EXISTS idx_trade_exits_closed_at ON trade_exits(closed_at DESC);
