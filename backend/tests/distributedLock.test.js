'use strict';

/**
 * Tests for the Redis-backed distributed lock.
 *
 * ioredis is mocked with a single in-process key store shared across every
 * client instance, so two isolated module loads of distributedLock behave like
 * two replicas contending for the same Redis (`SET NX PX` + Lua release).
 *
 * The in-process fallback path (REDIS_HOST unset) is exercised separately.
 */

// Shared key store across all mocked Redis instances. `mock` prefix lets the
// hoisted jest.mock factory reference it.
const mockStore = new Map();

jest.mock('ioredis', () => {
  const NodeEventEmitter = require('events');
  return class MockRedis extends NodeEventEmitter {
    connect() { return Promise.resolve(); }

    // Supports: set(key, value, 'PX', ttlMs, 'NX')
    async set(key, value, ...opts) {
      const nx = opts.includes('NX');
      const pxIdx = opts.indexOf('PX');
      const ttl = pxIdx >= 0 ? Number(opts[pxIdx + 1]) : null;

      const existing = mockStore.get(key);
      const alive = existing && (existing.expiresAt == null || existing.expiresAt > Date.now());
      if (nx && alive) return null;

      mockStore.set(key, { value, expiresAt: ttl != null ? Date.now() + ttl : null });
      return 'OK';
    }

    // Supports the release script: GET-compare-DEL.
    async eval(_script, _numKeys, key, token) {
      const existing = mockStore.get(key);
      const alive = existing && (existing.expiresAt == null || existing.expiresAt > Date.now());
      if (alive && existing.value === token) {
        mockStore.delete(key);
        return 1;
      }
      return 0;
    }

    async quit() { return 'OK'; }
  };
});

function loadLock() {
  let mod;
  jest.isolateModules(() => {
    mod = require('../src/services/distributedLock');
  });
  return mod;
}

describe('distributedLock', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    mockStore.clear();
    jest.useRealTimers();
  });

  describe('Redis-backed (REDIS_HOST set)', () => {
    beforeEach(() => {
      process.env.REDIS_HOST = 'localhost';
    });

    it('grants the lock to exactly one of two contending replicas', async () => {
      const a = loadLock();
      const b = loadLock();

      const tokenA = await a.acquire('sync:lock:school-1', 5000);
      const tokenB = await b.acquire('sync:lock:school-1', 5000);

      expect(tokenA).toBeTruthy();
      expect(tokenB).toBeNull();
    });

    it('lets another replica acquire after the holder releases', async () => {
      const a = loadLock();
      const b = loadLock();

      const tokenA = await a.acquire('sync:lock:school-1', 5000);
      expect(await b.acquire('sync:lock:school-1', 5000)).toBeNull();

      expect(await a.release('sync:lock:school-1', tokenA)).toBe(true);

      const tokenB = await b.acquire('sync:lock:school-1', 5000);
      expect(tokenB).toBeTruthy();
    });

    it('does not release a lock owned by someone else', async () => {
      const a = loadLock();
      await a.acquire('sync:lock:school-1', 5000);

      // Wrong token → no release, lock stays held.
      expect(await a.release('sync:lock:school-1', 'not-the-token')).toBe(false);

      const b = loadLock();
      expect(await b.acquire('sync:lock:school-1', 5000)).toBeNull();
    });

    it('lets the lock be retaken after its TTL expires', async () => {
      jest.useFakeTimers();
      const a = loadLock();
      const b = loadLock();

      await a.acquire('sync:lock:school-1', 1000);
      expect(await b.acquire('sync:lock:school-1', 1000)).toBeNull();

      jest.advanceTimersByTime(1500); // past TTL

      expect(await b.acquire('sync:lock:school-1', 1000)).toBeTruthy();
    });
  });

  describe('in-process fallback (no REDIS_HOST)', () => {
    beforeEach(() => {
      delete process.env.REDIS_HOST;
    });

    it('still enforces mutual exclusion within a single process', async () => {
      const lock = loadLock();
      expect(lock._isRedisEnabled()).toBe(false);

      const token = await lock.acquire('sync:lock:school-1', 5000);
      expect(token).toBeTruthy();
      expect(await lock.acquire('sync:lock:school-1', 5000)).toBeNull();

      expect(await lock.release('sync:lock:school-1', token)).toBe(true);
      expect(await lock.acquire('sync:lock:school-1', 5000)).toBeTruthy();
    });
  });

  describe('withLock helper', () => {
    beforeEach(() => { delete process.env.REDIS_HOST; });

    it('runs fn while holding the lock and releases afterward', async () => {
      const lock = loadLock();
      const result = await lock.withLock('k', 5000, async () => 'ran');
      expect(result).toBe('ran');
      // Lock released → can re-acquire.
      expect(await lock.acquire('k', 5000)).toBeTruthy();
    });

    it('returns the contended sentinel without running fn when held', async () => {
      const lock = loadLock();
      await lock.acquire('k', 5000);
      const fn = jest.fn();
      const result = await lock.withLock('k', 5000, fn, 'SKIPPED');
      expect(fn).not.toHaveBeenCalled();
      expect(result).toBe('SKIPPED');
    });
  });
});
