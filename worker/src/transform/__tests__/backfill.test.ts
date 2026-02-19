import { describe, it, expect, vi, afterEach } from 'vitest';
import { isBackfillNeeded } from '../backfill';
import type { PipelineMeta } from '@jacklabbe/shared';

describe('isBackfillNeeded', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true when meta is null (no meta.json in R2)', () => {
    expect(isBackfillNeeded(null)).toBe(true);
  });

  it('should return true when lastUpdated is older than 48 hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-19T12:00:00Z'));

    const staleMeta: PipelineMeta = {
      lastUpdated: '2026-02-17T11:00:00Z', // 49 hours ago
      status: 'ok',
      projectCount: 10,
      publicCount: 7,
      privateCount: 3,
    };
    expect(isBackfillNeeded(staleMeta)).toBe(true);
  });

  it('should return false when lastUpdated is within 48 hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-19T12:00:00Z'));

    const freshMeta: PipelineMeta = {
      lastUpdated: '2026-02-18T12:00:00Z', // exactly 24 hours ago
      status: 'ok',
      projectCount: 10,
      publicCount: 7,
      privateCount: 3,
    };
    expect(isBackfillNeeded(freshMeta)).toBe(false);
  });

  it('should return false when lastUpdated is exactly 48 hours ago (boundary)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-19T12:00:00Z'));

    const boundaryMeta: PipelineMeta = {
      lastUpdated: '2026-02-17T12:00:00Z', // exactly 48 hours ago
      status: 'ok',
      projectCount: 10,
      publicCount: 7,
      privateCount: 3,
    };
    // At exactly 48h, it should NOT need backfill (> 48h, not >=)
    expect(isBackfillNeeded(boundaryMeta)).toBe(false);
  });

  it('should return true when meta has error status but is stale', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-19T12:00:00Z'));

    const errorMeta: PipelineMeta = {
      lastUpdated: '2026-02-16T00:00:00Z', // > 48h ago
      status: 'error',
      error: 'Rate limited',
      projectCount: 5,
      publicCount: 3,
      privateCount: 2,
    };
    expect(isBackfillNeeded(errorMeta)).toBe(true);
  });
});
