jest.mock('@/features/storage/mmkv', () => {
  const s: Record<string, string> = {};
  return { storage: { getString: jest.fn((k: string) => s[k]), set: jest.fn((k: string, v: string) => { s[k] = v; }), delete: jest.fn((k: string) => { delete s[k]; }), clearAll: jest.fn(() => { for (const k of Object.keys(s)) delete s[k]; }) }, __store: s };
});
const mf = jest.fn(); global.fetch = mf;
import { getDeviceId, submitScore, getLeaderboard, healthCheck, submitSessionScores } from '../api';
import type { ScoreSubmission } from '../api';
const mm = jest.requireMock('@/features/storage/mmkv') as { storage: { getString: jest.Mock; set: jest.Mock }; __store: Record<string, string> };
function cs() { for (const k of Object.keys(mm.__store)) delete mm.__store[k]; }
function ok(d: unknown = {}) { return { ok: true, status: 200, statusText: 'OK', json: jest.fn().mockResolvedValue({ success: true, data: d }) }; }
function er(s: number, e?: string) { return { ok: false, status: s, statusText: 'E', json: jest.fn().mockResolvedValue({ success: false, error: e ?? 'HTTP ' + s }) }; }

describe('getDeviceId', () => {
  beforeEach(() => { cs(); jest.clearAllMocks(); });
  it('generates bp_ prefix', () => { expect(getDeviceId().startsWith('bp_')).toBe(true); });
  it('persists on second call', () => { expect(getDeviceId()).toBe(getDeviceId()); });
  it('format bp_timestamp_random', () => { const p = getDeviceId().split('_'); expect(p).toHaveLength(3); expect(p[0]).toBe('bp'); });
  it('stores via storage.set', () => { getDeviceId(); expect(mm.storage.set).toHaveBeenCalledWith('app.deviceId', expect.stringMatching(/^bp_/)); });
  it('does not overwrite existing', () => { mm.__store['app.deviceId'] = 'bp_x_y'; expect(getDeviceId()).toBe('bp_x_y'); });
});

describe('submitScore', () => {
  beforeEach(() => { jest.clearAllMocks(); cs(); });
  it('sends correct POST body', async () => {
    mf.mockResolvedValue(ok({ id: 's' }));
    const d: ScoreSubmission = { device_id: 'bp_t_1', game_id: 'g', mode: 'activation', score: 85, level: 3, accuracy: 0.9, avg_response_time: 450 };
    await submitScore(d);
    expect(mf.mock.calls[0][0]).toContain('/api/v1/scores');
    expect(mf.mock.calls[0][1].method).toBe('POST');
    expect(JSON.parse(mf.mock.calls[0][1].body)).toEqual(d);
  });
  it('handles success', async () => { mf.mockResolvedValue(ok({ id: 's' })); expect((await submitScore({ device_id: 'x', game_id: 'y', mode: 'rest', score: 1, level: 1, accuracy: 0.5 })).success).toBe(true); });
  it('handles error', async () => { mf.mockResolvedValue(er(400, 'bad')); expect((await submitScore({ device_id: 'x', game_id: 'y', mode: 'rest', score: 1, level: 1, accuracy: 0.5 })).error).toBe('bad'); });
});

describe('getLeaderboard', () => {
  beforeEach(() => { jest.clearAllMocks(); cs(); });
  it('builds query with all params', async () => { mf.mockResolvedValue(ok([])); await getLeaderboard({ period: 'weekly', limit: 10, game_id: 'g' }); expect(mf.mock.calls[0][0]).toContain('period=weekly'); });
  it('empty params no qs', async () => { mf.mockResolvedValue(ok([])); await getLeaderboard({}); expect(mf.mock.calls[0][0]).not.toContain('?'); });
  it('no args no qs', async () => { mf.mockResolvedValue(ok([])); await getLeaderboard(); expect(mf.mock.calls[0][0]).not.toContain('?'); });
  it('uses GET method', async () => { mf.mockResolvedValue(ok([])); await getLeaderboard(); expect(mf.mock.calls[0][1].method).toBe('GET'); });
});

describe('submitSessionScores', () => {
  beforeEach(() => { jest.clearAllMocks(); cs(); mf.mockResolvedValue(ok({ id: 's' })); });
  it('maps gameResults and calls fetch for each', () => {
    submitSessionScores([{ gameId: 'a', score: 85.7, difficulty: 3 as const, accuracy: 0.912, reactionTimeMs: 400 }, { gameId: 'b', score: 72.3, difficulty: 2 as const, accuracy: 0.756 }], 'activation');
    expect(mf).toHaveBeenCalledTimes(2);
    expect(JSON.parse(mf.mock.calls[0][1].body).score).toBe(86);
    expect(JSON.parse(mf.mock.calls[1][1].body).score).toBe(72);
  });
  it('uses same deviceId', () => {
    submitSessionScores([{ gameId: 'a', score: 1, difficulty: 1 as const, accuracy: 0.5 }, { gameId: 'b', score: 2, difficulty: 1 as const, accuracy: 0.5 }], 'rest');
    expect(JSON.parse(mf.mock.calls[0][1].body).device_id).toBe(JSON.parse(mf.mock.calls[1][1].body).device_id);
  });
  it('handles empty array', () => { submitSessionScores([], 'development'); expect(mf).not.toHaveBeenCalled(); });
});

describe('healthCheck', () => {
  beforeEach(() => { jest.clearAllMocks(); cs(); });
  it('calls correct path', async () => { mf.mockResolvedValue(ok({})); await healthCheck(); expect(mf.mock.calls[0][0]).toContain('/api/v1/health'); });
});

describe('timeout/abort', () => {
  beforeEach(() => { jest.clearAllMocks(); cs(); jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });
  it('passes AbortSignal', async () => { mf.mockResolvedValue(ok()); const p = healthCheck(); jest.runAllTimers(); await p; expect(mf.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal); });
});

describe('network errors', () => {
  beforeEach(() => { jest.clearAllMocks(); cs(); });
  it('network failure', async () => { mf.mockRejectedValue(new Error('f')); expect((await healthCheck()).error).toBe('f'); });
  it('non-Error throw', async () => { mf.mockRejectedValue('x'); expect((await healthCheck()).error).toBe('Unknown network error'); });
  it('HTTP error', async () => { mf.mockResolvedValue(er(500, 'ISE')); expect((await healthCheck()).error).toBe('ISE'); });
  it('fallback to HTTP status', async () => { mf.mockResolvedValue({ ok: false, status: 404, statusText: 'NF', json: jest.fn().mockResolvedValue({ success: false }) }); expect((await healthCheck()).error).toBe('HTTP 404'); });
});