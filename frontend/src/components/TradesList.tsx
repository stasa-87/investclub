import { useEffect, useState } from 'react'
import { Card, Text, Badge, Button } from '@tremor/react'

type Trade = {
  id: number
  ticker: string
  status: string
  strategy: string
  timestamp: string
  price: number
  quantity: number
}

export default function TradesList() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [ticker, setTicker] = useState('')
  const [status, setStatus] = useState('')
  const [strategy, setStrategy] = useState('')
  const [timeframeStart, setTimeframeStart] = useState('')
  const [timeframeEnd, setTimeframeEnd] = useState('')

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [total, setTotal] = useState(0)

  const buildUrl = () => {
    const params = new URLSearchParams()
    if (ticker) params.set('ticker', ticker)
    if (status) params.set('status', status)
    if (strategy) params.set('strategy', strategy)
    if (timeframeStart) params.set('timeframe_start', timeframeStart)
    if (timeframeEnd) params.set('timeframe_end', timeframeEnd)
    params.set('page', String(page))
    params.set('per_page', String(perPage))
    return `/api/trades?${params.toString()}`
  }

  useEffect(() => {
    let cancelled = false
    const fetchTrades = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(buildUrl())
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (cancelled) return
        setTrades(json.data ?? [])
        setTotal(json.total ?? 0)
      } catch (err) {
        if (cancelled) return
        setError(String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchTrades()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, status, strategy, timeframeStart, timeframeEnd, page, perPage])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between">
        <div>
          <Text className="text-lg font-semibold">Trades</Text>
          <Text className="text-sm text-slate-400">Filter and paginate the trades list</Text>
        </div>
        <div className="flex gap-2">
          <Badge color="blue">Total: {total}</Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input
          className="rounded border p-2 bg-white/5 text-white"
          placeholder="Ticker (e.g. AAPL)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        />
        <input
          className="rounded border p-2 bg-white/5 text-white"
          placeholder="Status (open|closed)"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <input
          className="rounded border p-2 bg-white/5 text-white"
          placeholder="Strategy"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
        />
        <div className="sm:col-span-1">
          <label className="text-xs text-slate-400">From</label>
          <input
            type="datetime-local"
            className="mt-1 rounded border p-2 bg-white/5 text-white w-full"
            value={timeframeStart}
            onChange={(e) => setTimeframeStart(e.target.value)}
          />
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs text-slate-400">To</label>
          <input
            type="datetime-local"
            className="mt-1 rounded border p-2 bg-white/5 text-white w-full"
            value={timeframeEnd}
            onChange={(e) => setTimeframeEnd(e.target.value)}
          />
        </div>
        <div className="sm:col-span-1 flex items-end gap-2">
          <Button color="gray" onClick={() => { setTicker(''); setStatus(''); setStrategy(''); setTimeframeStart(''); setTimeframeEnd(''); setPage(1); }}>Reset</Button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        {loading ? (
          <Text>Loading...</Text>
        ) : error ? (
          <Text className="text-red-400">Error: {error}</Text>
        ) : (
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="p-2">ID</th>
                <th className="p-2">Ticker</th>
                <th className="p-2">Status</th>
                <th className="p-2">Strategy</th>
                <th className="p-2">Timestamp</th>
                <th className="p-2">Price</th>
                <th className="p-2">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-t border-white/5">
                  <td className="p-2">{t.id}</td>
                  <td className="p-2">{t.ticker}</td>
                  <td className="p-2">{t.status}</td>
                  <td className="p-2">{t.strategy}</td>
                  <td className="p-2">{new Date(t.timestamp).toLocaleString()}</td>
                  <td className="p-2">{t.price}</td>
                  <td className="p-2">{t.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button color="gray" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Prev
          </Button>
          <Text>Page {page} / {totalPages}</Text>
          <Button color="gray" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Next
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Per page</label>
          <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="rounded border p-1 bg-white/5 text-white">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </Card>
  )
}
