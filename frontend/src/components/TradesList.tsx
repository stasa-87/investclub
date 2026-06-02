import { useEffect, useState } from 'react'
import { Card, Text, Badge, Button } from '@tremor/react'
import { request } from '../lib/auth'

// type Trade removed (now inlined in mapping)

type TradeExitDto = {
  id: number
  closedAt: string
  quantity: string | number
  exitPrice: string | number
  notes?: string
}

type RawTrade = {
  id: number
  openedAt: string
  ticker: string
  strategy: string
  status: string
  entryPrice: string | number
  quantity: string | number
  exits?: TradeExitDto[]
  // other fields ignored
}


export default function TradesList() {
  const [trades, setTrades] = useState<RawTrade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedTradeIds, setExpandedTradeIds] = useState<number[]>([])

  const [ticker, setTicker] = useState('')
  const [status, setStatus] = useState('')
  const [strategy, setStrategy] = useState('')
  const [timeframeStart, setTimeframeStart] = useState('')
  const [timeframeEnd, setTimeframeEnd] = useState('')

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let cancelled = false
    const fetchTrades = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (ticker) params.append('ticker', ticker)
        if (status) params.append('status', status)
        if (strategy) params.append('strategy', strategy)
        if (timeframeStart) params.append('timeframe_start', timeframeStart)
        if (timeframeEnd) params.append('timeframe_end', timeframeEnd)
        params.append('page', String(page))
        params.append('per_page', String(perPage))
        const res = await request(`/api/trades?${params.toString()}`, { auth: true })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (cancelled) return
        setTrades(Array.isArray(json.data) ? json.data : [])
        setTotal(typeof json.total === 'number' ? json.total : 0)
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

  const toggleExpanded = (tradeId: number) => {
    setExpandedTradeIds((current) =>
      current.includes(tradeId) ? current.filter((id) => id !== tradeId) : [...current, tradeId],
    )
  }

  return (
    <Card className="mt-6 border border-white/10 bg-slate-950/90 p-6 shadow-xl shadow-black/30">
      <div className="flex items-center justify-between">
        <div>
          <Text className="text-lg font-semibold text-white">Trades</Text>
          <Text className="text-sm text-slate-300">Filter and paginate the trades list</Text>
        </div>
        <div className="flex gap-2">
          <Badge color="blue">Total: {total}</Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-400"
          placeholder="Ticker (e.g. AAPL)"
          value={ticker}
          onChange={(e) => { setTicker(e.target.value); setPage(1); }}
        />
        <input
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-400"
          placeholder="Status (open|closed)"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        />
        <input
          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-400"
          placeholder="Strategy"
          value={strategy}
          onChange={(e) => { setStrategy(e.target.value); setPage(1); }}
        />
        <div className="sm:col-span-1">
          <label className="text-xs text-slate-300">From</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
            value={timeframeStart}
            onChange={(e) => { setTimeframeStart(e.target.value); setPage(1); }}
          />
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs text-slate-300">To</label>
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
            value={timeframeEnd}
            onChange={(e) => { setTimeframeEnd(e.target.value); setPage(1); }}
          />
        </div>
        <div className="sm:col-span-1 flex items-end gap-2">
          <Button color="gray" onClick={() => { setTicker(''); setStatus(''); setStrategy(''); setTimeframeStart(''); setTimeframeEnd(''); setPage(1); }}>Reset</Button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        {loading ? (
          <Text className="text-slate-200">Loading...</Text>
        ) : error ? (
          <Text className="text-rose-300">Error: {error}</Text>
        ) : (
          <table className="w-full table-auto overflow-hidden text-sm text-slate-100">
            <thead className="border-b border-slate-700/80 bg-slate-900/95">
              <tr className="text-left text-slate-200">
                <th className="p-3">Trade</th>
                <th className="p-3">Status</th>
                <th className="p-3">Strategy</th>
                <th className="p-3">Opened</th>
                <th className="p-3">Entry</th>
                <th className="p-3">Quantity</th>
                <th className="p-3 text-right">Rows</th>
              </tr>
            </thead>
            <tbody>
            {trades.length === 0 ? (
               <tr>
                 <td colSpan={7} className="p-6 text-center text-slate-300">No trades found.</td>
               </tr>
             ) : (
              trades.flatMap((t) => {
                const hasExits = Array.isArray(t.exits) && t.exits.length > 0
                const isExpanded = expandedTradeIds.includes(t.id)

                return [
                  <tr
                    key={t.id}
                    className="border-t border-slate-700/70 bg-slate-800/90 transition hover:bg-slate-700/90"
                  >
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(t.id)}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 text-xs font-semibold text-cyan-200 transition ${
                            hasExits ? 'opacity-100' : 'opacity-40'
                          }`}
                        >
                          {hasExits ? (isExpanded ? '−' : '+') : '•'}
                        </span>
                        <div>
                          <div className="font-semibold text-white">
                            {t.ticker} <span className="text-slate-400">#{t.id}</span>
                          </div>
                          <div className="text-xs text-slate-300">
                            {hasExits ? 'Placeholder row with expandable exact trades' : 'Placeholder row with no exact trades yet'}
                          </div>
                        </div>
                      </button>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-200">
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-100">{t.strategy}</td>
                    <td className="p-3 text-slate-200">{new Date(t.openedAt).toLocaleString()}</td>
                    <td className="p-3 text-slate-100">
                      {typeof t.entryPrice === 'string' ? parseFloat(t.entryPrice) : t.entryPrice}
                    </td>
                    <td className="p-3 text-slate-100">
                      {typeof t.quantity === 'string' ? parseFloat(t.quantity) : t.quantity}
                    </td>
                    <td className="p-3 text-right text-slate-300">{hasExits ? t.exits?.length : 0}</td>
                  </tr>,
                  ...(hasExits && isExpanded
                    ? t.exits!.map((exit) => (
                        <tr
                          key={`${t.id}-exit-${exit.id}`}
                          className="border-t border-cyan-900/50 bg-slate-950/95 text-sm"
                        >
                          <td className="p-3 pl-14">
                            <div className="font-medium text-cyan-100">Exact trade / Exit #{exit.id}</div>
                            <div className="mt-1 text-xs text-slate-300">{exit.notes || 'No notes provided'}</div>
                          </td>
                          <td className="p-3 text-cyan-100">Closed</td>
                          <td className="p-3 text-slate-200">
                            {new Date(exit.closedAt).toLocaleString()}
                          </td>
                          <td className="p-3 text-slate-200">Exit fill</td>
                          <td className="p-3 text-cyan-100">
                            {typeof exit.exitPrice === 'string' ? parseFloat(exit.exitPrice) : exit.exitPrice}
                          </td>
                          <td className="p-3 text-cyan-100">
                            {typeof exit.quantity === 'string' ? parseFloat(exit.quantity) : exit.quantity}
                          </td>
                          <td className="p-3 text-right text-slate-400">subrow</td>
                        </tr>
                      ))
                    : []),
                ]
              })
            )}
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
          <label className="text-sm text-slate-300">Per page</label>
          <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-white">
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
