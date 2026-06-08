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
  side: string
  timeframe: string
  strategy: string
  status: string
  stopLoss: string | number
  computedRMultiple?: string | number | null
  remainingQuantity?: string | number
  entryPrice: string | number
  quantity: string | number
  exits?: TradeExitDto[]
  // other fields ignored
}


type TradePlaceholderRequest = {
  openedAt: string
  ticker: string
  side: string
  timeframe: string
  strategy: string
  currency: string
  quantity: number
  entryPrice: number
  stopLoss: number
  takeProfit?: number
  notes?: string
  beThresholdPercent: number
}

function toOffsetDateTime(value: string) {
  return new Date(value).toISOString()
}

function formatApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string' && error.message.trim()) {
      return error.message
    }

    if ('fieldErrors' in error && error.fieldErrors && typeof error.fieldErrors === 'object') {
      const messages = Object.values(error.fieldErrors as Record<string, string>).filter(Boolean)
      if (messages.length > 0) {
        return messages.join(' ')
      }
    }
  }

  return fallback
}

function toNumber(value: string | number | null | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    return Number(value)
  }

  return null
}

export default function TradesList() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  // Exit form state management at top-level
  const [exitFormVisible, setExitFormVisible] = useState<number | null>(null)
  const [exitForm, setExitForm] = useState<Record<number, { closedAt: string; quantity: string; exitPrice: string; notes: string }>>({})
  const [exitFormError, setExitFormError] = useState<Record<number, string | null>>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<TradePlaceholderRequest>({
    openedAt: '',
    ticker: '',
    side: '',
    timeframe: '',
    strategy: '',
    currency: '',
    quantity: 0,
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: undefined,
    notes: '',
    beThresholdPercent: 0,
  })
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSubmitting, setCreateSubmitting] = useState(false)
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
  }, [ticker, status, strategy, timeframeStart, timeframeEnd, page, perPage, refreshTrigger])

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
         <Button color="cyan" onClick={() => setShowCreateModal(true)}>
           New Trade
         </Button>
       </div>

       {showCreateModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
           <div className="w-full max-w-lg rounded-xl bg-slate-900 p-6 shadow-2xl border border-white/10">
             <Text className="text-lg font-semibold text-white mb-4">Create Trade Placeholder</Text>
             <form
               onSubmit={async (e) => {
                  e.preventDefault()
                  setCreateSubmitting(true)
                  setCreateError(null)
                  // Basic validation
                  if (!createForm.openedAt || !createForm.ticker || !createForm.side || !createForm.timeframe || !createForm.strategy || !createForm.currency || !createForm.quantity || !createForm.entryPrice || !createForm.stopLoss || !createForm.beThresholdPercent) {
                    setCreateError('Please fill all required fields.')
                    setCreateSubmitting(false)
                    return
                  }
                  try {
                    const res = await request('/api/trades', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...createForm,
                        openedAt: toOffsetDateTime(createForm.openedAt),
                      }),
                      auth: true,
                    })
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}))
                      setCreateError(formatApiErrorMessage(err, 'Failed to create trade.'))
                      setCreateSubmitting(false)
                      return
                    }
                    setShowCreateModal(false)
                    setCreateForm({
                      openedAt: '', ticker: '', side: '', timeframe: '', strategy: '', currency: '', quantity: 0, entryPrice: 0, stopLoss: 0, takeProfit: undefined, notes: '', beThresholdPercent: 0,
                    })
                    setTimeout(() => { window.scrollTo(0, 0) }, 100)
                    setRefreshTrigger((value) => value + 1)
                  } catch (err: unknown) {
                    setCreateError(formatApiErrorMessage(err, 'Failed to create trade.'))
                  } finally {
                    setCreateSubmitting(false)
                  }
                }}
              >
               <div className="grid grid-cols-2 gap-3 mb-3">
                 <div>
                   <label className="block text-xs text-slate-300 mb-1">Opened At*</label>
                   <input type="datetime-local" className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white" value={createForm.openedAt} onChange={e => setCreateForm(f => ({ ...f, openedAt: e.target.value }))} required />
                 </div>
                 <div>
                   <label className="block text-xs text-slate-300 mb-1">Ticker*</label>
                   <input type="text" className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white" value={createForm.ticker} onChange={e => setCreateForm(f => ({ ...f, ticker: e.target.value }))} required />
                 </div>
                 <div>
                   <label className="block text-xs text-slate-300 mb-1">Side*</label>
                   <select className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white" value={createForm.side} onChange={e => setCreateForm(f => ({ ...f, side: e.target.value }))} required>
                     <option value="">Select</option>
                      <option value="BUY">Buy</option>
                      <option value="SELL">Sell</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs text-slate-300 mb-1">Timeframe*</label>
                   <input type="text" className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white" value={createForm.timeframe} onChange={e => setCreateForm(f => ({ ...f, timeframe: e.target.value }))} required />
                 </div>
                 <div>
                   <label className="block text-xs text-slate-300 mb-1">Strategy*</label>
                   <input type="text" className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white" value={createForm.strategy} onChange={e => setCreateForm(f => ({ ...f, strategy: e.target.value }))} required />
                 </div>
                 <div>
                   <label className="block text-xs text-slate-300 mb-1">Currency*</label>
                   <input type="text" className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white" value={createForm.currency} onChange={e => setCreateForm(f => ({ ...f, currency: e.target.value }))} required />
                 </div>
                 <div>
                   <label className="block text-xs text-slate-300 mb-1">Quantity*</label>
                   <input type="number" step="any" className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white" value={createForm.quantity} onChange={e => setCreateForm(f => ({ ...f, quantity: Number(e.target.value) }))} required />
                 </div>
                 <div>
                   <label className="block text-xs text-slate-300 mb-1">Entry Price*</label>
                   <input type="number" step="any" className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white" value={createForm.entryPrice} onChange={e => setCreateForm(f => ({ ...f, entryPrice: Number(e.target.value) }))} required />
                 </div>
                 <div>
                   <label className="block text-xs text-slate-300 mb-1">Stop Loss*</label>
                   <input type="number" step="any" className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white" value={createForm.stopLoss} onChange={e => setCreateForm(f => ({ ...f, stopLoss: Number(e.target.value) }))} required />
                 </div>
                 <div>
                   <label className="block text-xs text-slate-300 mb-1">Take Profit</label>
                   <input type="number" step="any" className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white" value={createForm.takeProfit ?? ''} onChange={e => setCreateForm(f => ({ ...f, takeProfit: e.target.value ? Number(e.target.value) : undefined }))} />
                 </div>
                 <div>
                   <label className="block text-xs text-slate-300 mb-1">Notes</label>
                   <input type="text" className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white" value={createForm.notes ?? ''} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))} />
                 </div>
                 <div>
                   <label className="block text-xs text-slate-300 mb-1">BE Threshold %*</label>
                   <input type="number" step="any" className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-white" value={createForm.beThresholdPercent} onChange={e => setCreateForm(f => ({ ...f, beThresholdPercent: Number(e.target.value) }))} required />
                 </div>
               </div>
               {createError && <Text className="text-rose-400 mb-2">{createError}</Text>}
               <div className="flex gap-2 justify-end mt-4">
                 <Button color="gray" type="button" onClick={() => setShowCreateModal(false)} disabled={createSubmitting}>Cancel</Button>
                 <Button color="cyan" type="submit" loading={createSubmitting} disabled={createSubmitting}>Create</Button>
               </div>
             </form>
           </div>
         </div>
       )}

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
                <th className="p-3 text-right">R multiple</th>
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
                const canAddExit = t.status === 'PENDING'
                const isExpanded = expandedTradeIds.includes(t.id)
                const stopLoss = toNumber(t.stopLoss)
                const remainingQuantity = toNumber(t.remainingQuantity) ?? toNumber(t.quantity)
                const rMultiple = toNumber(t.computedRMultiple)
                // Inline exit form state is now managed at top-level
                const isExitFormOpen = exitFormVisible === t.id;
                const formState = exitForm[t.id] || { closedAt: '', quantity: '', exitPrice: '', notes: '' };
                const formError = exitFormError[t.id] || null;

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
                              {hasExits ? 'Position with expandable exact trades' : 'Placeholder row with no exact trades yet'}
                            </div>
                            <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                              {t.side} • {t.timeframe}
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
                    <td className="p-3 text-right text-slate-300">
                      <div className="flex items-center justify-end gap-2">
                        {canAddExit ? (
                          <>
                            <Button
                              color="cyan"
                              size="xs"
                              type="button"
                              onClick={() => {
                                if (!expandedTradeIds.includes(t.id)) {
                                  toggleExpanded(t.id)
                                }
                                setExitFormVisible(t.id)
                                setExitForm((current) => ({
                                  ...current,
                                  [t.id]: current[t.id] ?? { closedAt: '', quantity: '', exitPrice: '', notes: '' },
                                }))
                                setExitFormError((current) => ({ ...current, [t.id]: null }))
                              }}
                            >
                              Add Exit
                            </Button>
                            {stopLoss !== null && remainingQuantity !== null && remainingQuantity > 0 ? (
                              <Button
                                color="gray"
                                size="xs"
                                type="button"
                                onClick={() => {
                                  if (!expandedTradeIds.includes(t.id)) {
                                    toggleExpanded(t.id)
                                  }
                                  setExitFormVisible(t.id)
                                  setExitForm((current) => ({
                                    ...current,
                                    [t.id]: {
                                      closedAt: current[t.id]?.closedAt ?? '',
                                      quantity: String(remainingQuantity),
                                      exitPrice: String(stopLoss),
                                      notes: current[t.id]?.notes ?? 'Stop-loss prefill',
                                    },
                                  }))
                                  setExitFormError((current) => ({ ...current, [t.id]: null }))
                                }}
                              >
                                Stop loss
                              </Button>
                            ) : null}
                          </>
                        ) : null}
                        <span className="font-medium text-cyan-100">
                          {rMultiple === null ? '—' : rMultiple.toFixed(2)}R
                        </span>
                      </div>
                    </td>
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
                    : [])
                    // Inline exit form for expanded placeholder
                    .concat(
                      canAddExit && isExpanded && isExitFormOpen
                        ? [
                            <tr key={`${t.id}-exit-form`} className="border-t border-cyan-900/50 bg-slate-950/95 text-sm">
                              <td className="p-3 pl-14" colSpan={7}>
                                <form
                                  className="flex flex-col gap-2"
                                  onSubmit={async e => {
                                    e.preventDefault()
                                    setExitFormError(f => ({ ...f, [t.id]: null }))
                                    // Basic validation
                                    if (!formState.closedAt || !formState.quantity || !formState.exitPrice) {
                                      setExitFormError(f => ({ ...f, [t.id]: 'All required fields must be filled.' }))
                                      return
                                    }
                                    try {
                                      const res = await request(`/api/trades/${t.id}/exits`, {
                                        method: 'POST',
                                        auth: true,
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          closedAt: toOffsetDateTime(formState.closedAt),
                                          quantity: formState.quantity,
                                          exitPrice: formState.exitPrice,
                                          notes: formState.notes || undefined,
                                        }),
                                      })
                                      if (!res.ok) {
                                        const err = await res.json().catch(() => ({}))
                                        setExitFormError(f => ({ ...f, [t.id]: formatApiErrorMessage(err, 'Failed to add exit.') }))
                                        return
                                      }
                                      setExitFormVisible(null)
                                      setExitFormError(f => ({ ...f, [t.id]: null }))
                                      setExitForm(f => ({ ...f, [t.id]: { closedAt: '', quantity: '', exitPrice: '', notes: '' } }))
                                      setRefreshTrigger((v: number) => v + 1)
                                    } catch (err: unknown) {
                                      setExitFormError(f => ({ ...f, [t.id]: formatApiErrorMessage(err, 'Network or server error.') }))
                                    }
                                  }}
                                >
                                  <div className="flex gap-2">
                                    <div>
                                      <label className="block text-xs text-slate-300">Closed At*</label>
                                      <input
                                        type="datetime-local"
                                        className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-white"
                                        value={formState.closedAt}
                                        onChange={e => setExitForm(f => ({ ...f, [t.id]: { ...formState, closedAt: e.target.value } }))}
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-slate-300">Quantity*</label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-white"
                                        value={formState.quantity}
                                        onChange={e => setExitForm(f => ({ ...f, [t.id]: { ...formState, quantity: e.target.value } }))}
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-slate-300">Exit Price*</label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-white"
                                        value={formState.exitPrice}
                                        onChange={e => setExitForm(f => ({ ...f, [t.id]: { ...formState, exitPrice: e.target.value } }))}
                                        required
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <label className="block text-xs text-slate-300">Notes</label>
                                      <input
                                        type="text"
                                        className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-white w-full"
                                        value={formState.notes}
                                        onChange={e => setExitForm(f => ({ ...f, [t.id]: { ...formState, notes: e.target.value } }))}
                                      />
                                    </div>
                                  </div>
                                  {formError && (
                                    <div className="text-xs text-rose-400">{formError}</div>
                                  )}
                                  <div className="flex gap-2 mt-2">
                                    <Button color="cyan" size="xs" type="submit">Submit Exit</Button>
                                    <Button color="gray" size="xs" type="button" onClick={() => { setExitFormVisible(null); setExitFormError(f => ({ ...f, [t.id]: null })); setExitForm(f => ({ ...f, [t.id]: { closedAt: '', quantity: '', exitPrice: '', notes: '' } })); }}>Cancel</Button>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          ]
                        : []
                    )
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
