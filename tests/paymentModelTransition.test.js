'use strict';

/**
 * #576 — paymentModel pre-save hook status-transition validation.
 *
 * Covers:
 *   1. SUCCESS → DISPUTED is allowed (via save()).
 *   2. FAILED  → SUCCESS is rejected with INVALID_TRANSITION.
 *   3. PENDING → FAILED  is allowed.
 *   4. SUBMITTED → FAILED is allowed.
 *   5. New documents bypass the transition check.
 *   6. No-op save (status unchanged) is allowed.
 */

// ── Capture the pre-save hook from the schema ─────────────────────────────────

let preSaveHook = null;

class MockSchema {
  constructor() {
    this.index  = jest.fn().mockReturnThis();
    this.virtual = jest.fn().mockReturnValue({ get: jest.fn() });
    this.pre  = jest.fn((event, fn) => {
      if (event === 'save') preSaveHook = fn;
    });
    this.post = jest.fn();
  }
}
MockSchema.Types = { Mixed: {} };

jest.mock('mongoose', () => ({
  Schema: MockSchema,
  model: jest.fn().mockReturnValue({}),
}));
jest.mock('../backend/src/utils/softDelete', () => jest.fn());
jest.mock('../backend/src/utils/memoEncryption', () => ({
  encryptMemo: jest.fn(v => v),
  decryptMemo: jest.fn(v => v),
}));

// Load the model so the schema and hooks are registered.
require('../backend/src/models/paymentModel');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a minimal Mongoose-like document for the pre-save hook.
 *
 * @param {string|null} originalStatus - Status stored in DB (null for new docs)
 * @param {string}      newStatus      - Current (possibly modified) status
 * @param {boolean}     isNew          - Whether this is an insert
 */
function makeDoc({ originalStatus, newStatus, isNew = false }) {
  return {
    isNew,
    status: newStatus,
    memo: null,
    isModified: jest.fn((field) => field === 'status' && originalStatus !== newStatus),
    $__: originalStatus !== null ? { savedState: { status: originalStatus } } : null,
  };
}

/** Wrap the hook callback in a Promise so tests can use async/await. */
function callHook(doc) {
  return new Promise((resolve, reject) => {
    preSaveHook.call(doc, (err) => (err ? reject(err) : resolve()));
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('pre-save hook is registered', () => {
  expect(preSaveHook).toBeInstanceOf(Function);
});

// 1. SUCCESS → DISPUTED
test('SUCCESS → DISPUTED is allowed via save()', async () => {
  const doc = makeDoc({ originalStatus: 'SUCCESS', newStatus: 'DISPUTED' });
  await expect(callHook(doc)).resolves.toBeUndefined();
});

// 2. FAILED → SUCCESS
test('FAILED → SUCCESS is rejected with code INVALID_TRANSITION', async () => {
  const doc = makeDoc({ originalStatus: 'FAILED', newStatus: 'SUCCESS' });
  await expect(callHook(doc)).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
});

// 3. PENDING → FAILED
test('PENDING → FAILED is allowed via save()', async () => {
  const doc = makeDoc({ originalStatus: 'PENDING', newStatus: 'FAILED' });
  await expect(callHook(doc)).resolves.toBeUndefined();
});

// 4. SUBMITTED → FAILED
test('SUBMITTED → FAILED is allowed via save()', async () => {
  const doc = makeDoc({ originalStatus: 'SUBMITTED', newStatus: 'FAILED' });
  await expect(callHook(doc)).resolves.toBeUndefined();
});

// 5. New document (insert) bypasses transition check
test('new document is allowed through without transition check', async () => {
  const doc = makeDoc({ originalStatus: null, newStatus: 'PENDING', isNew: true });
  await expect(callHook(doc)).resolves.toBeUndefined();
});

// 6. No-op save (status unchanged)
test('no-op save (status unchanged) is allowed', async () => {
  const doc = makeDoc({ originalStatus: 'SUCCESS', newStatus: 'SUCCESS' });
  await expect(callHook(doc)).resolves.toBeUndefined();
});

// Extra: other disallowed transitions
test('SUCCESS → FAILED is rejected with code INVALID_TRANSITION', async () => {
  const doc = makeDoc({ originalStatus: 'SUCCESS', newStatus: 'FAILED' });
  await expect(callHook(doc)).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
});

test('DISPUTED → PENDING is rejected with code INVALID_TRANSITION', async () => {
  const doc = makeDoc({ originalStatus: 'DISPUTED', newStatus: 'PENDING' });
  await expect(callHook(doc)).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
});
