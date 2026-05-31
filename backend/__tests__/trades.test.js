const request = require('supertest')
const app = require('../server')

describe('GET /api/trades', () => {
  test('returns paginated trades and supports ticker filter', async () => {
    const res = await request(app).get('/api/trades').query({ ticker: 'AAPL', page: 1, per_page: 10 })
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body).toHaveProperty('total')
    expect(res.body).toHaveProperty('page', 1)
    expect(res.body).toHaveProperty('per_page', 10)
  })

  test('timeframe filters work', async () => {
    const now = new Date()
    const start = new Date(now.getTime() - 24 * 3600 * 1000).toISOString()
    const res = await request(app).get('/api/trades').query({ timeframe_start: start })
    expect(res.statusCode).toBe(200)
    expect(res.body.data.every((t) => new Date(t.timestamp) >= new Date(start))).toBe(true)
  })
})
