import { describe, expect, it } from 'vitest'
import { utils } from './index'

describe('utils.countYear', () => {
  it('returns year diff when start and end are provided', () => {
    expect(utils.countYear('2020-01-01', '2023-01-01')).toBe(3)
  })

  it('returns non-negative year diff when end is null', () => {
    expect(utils.countYear('2020-01-01', null)).toBeGreaterThanOrEqual(0)
  })
})

describe('utils.formatDateString', () => {
  it('formats date to YYYY-MM-DD HH:mm:ss', () => {
    const result = utils.formatDateString('2024-01-01T00:00:00Z')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })
})
