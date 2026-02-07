import { calculateGameScore, calculateCompositeScore, generateSessionId } from '@/lib/scoring'

describe('calculateGameScore', () => {
  it('returns 0 for a result with no correct answers', () => {
    const score = calculateGameScore({
      gameId: 'test',
      score: 0,
      durationMs: 30000,
      accuracy: 0,
      difficulty: 1,
      correctCount: 0,
      totalCount: 10,
    })
    expect(score).toBe(0)
  })

  it('returns a high score for perfect accuracy and speed', () => {
    const score = calculateGameScore({
      gameId: 'test',
      score: 100,
      durationMs: 1000,
      accuracy: 1,
      difficulty: 5,
      correctCount: 10,
      totalCount: 10,
    })
    expect(score).toBeGreaterThan(80)
  })
})

describe('calculateCompositeScore', () => {
  it('returns 0 for empty results', () => {
    expect(calculateCompositeScore([])).toBe(0)
  })
})

describe('generateSessionId', () => {
  it('generates a string starting with bp_', () => {
    const id = generateSessionId()
    expect(id).toMatch(/^bp_/)
  })
})
