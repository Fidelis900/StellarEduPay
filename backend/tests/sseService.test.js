'use strict';

/**
 * Tests for the SSE fan-out service.
 *
 * Covers the horizontal-scaling guarantee (an emit on one replica reaches a
 * client connected to another), the per-connection heartbeat, the per-school
 * connection cap, and connection cleanup / metrics counting.
 *
 * ioredis is mocked with an in-process pub/sub bus shared across all client
 * instances, so two isolated module loads behave like two replicas talking to
 * the same Redis.
 */

const EventEmitter = require('events');

// Shared bus across all mocked Redis instances. The `mock` prefix lets the
// jest.mock factory (hoisted above imports) reference it.
const mockBus = new EventEmitter();
mockBus.setMaxListeners(0);

jest.mock('ioredis', () => {
  const NodeEventEmitter = require('events');
  return class MockRedis extends NodeEventEmitter {
    constructor() {
      super();
      this._channels = new Set();
      this._onPublish = (channel, message) => {
        if (this._channels.has(channel)) this.emit('message', channel, message);
      };
      mockBus.on('publish', this._onPublish);
    }
    connect() { return Promise.resolve(); }
    async subscribe(ch) { this._channels.add(ch); }
    async unsubscribe(ch) { this._channels.delete(ch); }
    async publish(ch, msg) { mockBus.emit('publish', ch, msg); return 1; }
    async quit() { mockBus.off('publish', this._onPublish); return 'OK'; }
  };
});

function loadReplica() {
  let mod;
  jest.isolateModules(() => {
    mod = require('../src/services/sseService');
  });
  return mod;
}

function mockRes() {
  return { write: jest.fn(), end: jest.fn() };
}

// Let the publish->message->fanout chain settle (publish().catch is async).
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('sseService', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.useRealTimers();
    mockBus.removeAllListeners('publish');
  });

  describe('cross-replica delivery (Redis pub/sub)', () => {
    beforeEach(() => {
      process.env.REDIS_HOST = 'localhost';
    });

    it('delivers an event emitted on replica A to a client on replica B', async () => {
      const replicaA = loadReplica();
      const replicaB = loadReplica();

      const resA = mockRes();
      const resB = mockRes();
      expect(replicaA.addClient('school-1', resA)).toBe(true);
      expect(replicaB.addClient('school-1', resB)).toBe(true);

      replicaA.emit('school-1', 'payment', { txHash: 'abc', amount: 10 });
      await flush();

      const expected = `event: payment\ndata: ${JSON.stringify({ txHash: 'abc', amount: 10 })}\n\n`;
      expect(resB.write).toHaveBeenCalledWith(expected);
      // Delivered exactly once on the emitting replica too — no double fan-out.
      expect(resA.write).toHaveBeenCalledWith(expected);
      expect(resA.write.mock.calls.filter((c) => c[0] === expected)).toHaveLength(1);

      replicaA.removeClient('school-1', resA);
      replicaB.removeClient('school-1', resB);
      await replicaA.close();
      await replicaB.close();
    });

    it('does not deliver to clients of a different school', async () => {
      const replica = loadReplica();
      const res = mockRes();
      replica.addClient('school-1', res);

      replica.emit('school-2', 'payment', { txHash: 'xyz' });
      await flush();

      const dataWrites = res.write.mock.calls.filter((c) => c[0].startsWith('event:'));
      expect(dataWrites).toHaveLength(0);
      replica.removeClient('school-1', res);
      await replica.close();
    });
  });

  describe('heartbeat', () => {
    it('writes a keepalive comment through a 60s idle period', () => {
      jest.useFakeTimers();
      delete process.env.REDIS_HOST; // single-process mode is fine for this
      process.env.SSE_HEARTBEAT_MS = '15000';
      const replica = loadReplica();

      const res = mockRes();
      replica.addClient('school-1', res);

      jest.advanceTimersByTime(60000);

      const pings = res.write.mock.calls.filter((c) => c[0] === ': ping\n\n');
      expect(pings.length).toBeGreaterThanOrEqual(4);

      replica.removeClient('school-1', res);
    });

    it('stops the heartbeat once the connection is removed', () => {
      jest.useFakeTimers();
      delete process.env.REDIS_HOST;
      process.env.SSE_HEARTBEAT_MS = '15000';
      const replica = loadReplica();

      const res = mockRes();
      replica.addClient('school-1', res);
      replica.removeClient('school-1', res);

      jest.advanceTimersByTime(60000);
      expect(res.write).not.toHaveBeenCalled();
    });
  });

  describe('max-connections-per-school guard', () => {
    it('rejects connections beyond the configured cap', () => {
      delete process.env.REDIS_HOST;
      process.env.SSE_MAX_CONNECTIONS_PER_SCHOOL = '2';
      const replica = loadReplica();

      const a = mockRes();
      const b = mockRes();
      expect(replica.addClient('school-1', a)).toBe(true);
      expect(replica.addClient('school-1', b)).toBe(true);
      expect(replica.addClient('school-1', mockRes())).toBe(false);

      // A different school has its own independent budget.
      const c = mockRes();
      expect(replica.addClient('school-2', c)).toBe(true);

      replica.removeClient('school-1', a);
      replica.removeClient('school-1', b);
      replica.removeClient('school-2', c);
    });
  });

  describe('cleanup and metrics', () => {
    it('counts active connections and clears them on removal', () => {
      delete process.env.REDIS_HOST;
      const replica = loadReplica();

      const a = mockRes();
      const b = mockRes();
      replica.addClient('school-1', a);
      replica.addClient('school-2', b);

      expect(replica.getStats()).toEqual({ schools: 2, connections: 2 });

      replica.removeClient('school-1', a);
      expect(replica.getStats()).toEqual({ schools: 1, connections: 1 });

      replica.removeClient('school-2', b);
      expect(replica.getStats()).toEqual({ schools: 0, connections: 0 });
    });

    it('removes a client whose write throws (closed/errored connection)', () => {
      delete process.env.REDIS_HOST;
      const replica = loadReplica();

      const good = mockRes();
      const broken = mockRes();
      broken.write = jest.fn(() => { throw new Error('EPIPE'); });

      replica.addClient('school-1', good);
      replica.addClient('school-1', broken);

      replica.emit('school-1', 'payment', { txHash: 'h' });

      expect(replica.getStats().connections).toBe(1);
      replica.removeClient('school-1', good);
    });
  });
});
