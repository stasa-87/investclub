const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

// Sample in-memory trades dataset
const trades = [];
const statuses = ['open', 'closed', 'cancelled'];
const strategies = ['mean-reversion', 'momentum', 'arbitrage'];
const tickers = ['AAPL', 'GOOG', 'TSLA', 'MSFT', 'AMZN'];

for (let i = 1; i <= 200; i++) {
  const ticker = tickers[i % tickers.length];
  const status = statuses[i % statuses.length];
  const strategy = strategies[i % strategies.length];
  const timestamp = new Date(Date.now() - i * 3600 * 1000).toISOString();
  trades.push({ id: i, ticker, status, strategy, timestamp, price: 100 + i, quantity: 10 + (i % 5) });
}

// Helper to filter by timeframe: expecting timeframe_start and timeframe_end as ISO strings
function inTimeframe(trade, start, end) {
  if (!start && !end) return true;
  const t = new Date(trade.timestamp).getTime();
  if (start && t < new Date(start).getTime()) return false;
  if (end && t > new Date(end).getTime()) return false;
  return true;
}

app.get('/api/trades', (req, res) => {
  try {
    const { ticker, status, strategy, timeframe_start, timeframe_end, page = '1', per_page = '20' } = req.query;
    let filtered = trades.slice();

    if (ticker) {
      filtered = filtered.filter((t) => t.ticker.toLowerCase() === String(ticker).toLowerCase());
    }
    if (status) {
      filtered = filtered.filter((t) => t.status === String(status));
    }
    if (strategy) {
      filtered = filtered.filter((t) => t.strategy === String(strategy));
    }
    if (timeframe_start || timeframe_end) {
      filtered = filtered.filter((t) => inTimeframe(t, timeframe_start, timeframe_end));
    }

    const total = filtered.length;
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const per = Math.max(1, Math.min(100, parseInt(String(per_page), 10) || 20));
    const offset = (p - 1) * per;
    const pageData = filtered.slice(offset, offset + per);

    res.json({ data: pageData, total, page: p, per_page: per });
  } catch (err) {
    // never swallow errors silently - return 500 with message
    res.status(500).json({ error: 'internal_error', message: String(err) });
  }
});

if (require.main === module) {
  app.listen(port, () => console.log(`Mock trades API listening on http://localhost:${port}`));
}

module.exports = app;
