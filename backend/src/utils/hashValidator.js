'use strict';

const STELLAR_HASH_REGEX = /^[0-9a-fA-F]{64}$/;

function validateTransactionHash(hash) {
  if (!hash) return { valid: false, error: 'Transaction hash is required', code: 'MISSING_HASH', normalized: null };
  if (typeof hash !== 'string') return { valid: false, error: 'Transaction hash must be a string', code: 'INVALID_HASH_TYPE', normalized: null };
  const trimmed = hash.trim();
  if (trimmed.length !== 64)
    return { valid: false, error: `Transaction hash must be exactly 64 characters, got ${trimmed.length}`, code: 'INVALID_HASH_LENGTH', normalized: null };
  if (!STELLAR_HASH_REGEX.test(trimmed))
    return { valid: false, error: 'Transaction hash must contain only hexadecimal characters', code: 'INVALID_HASH_FORMAT', normalized: null };
  return { valid: true, error: null, code: null, normalized: trimmed.toLowerCase() };
}

function validateHashMiddleware(paramName = 'txHash') {
  return (req, res, next) => {
    const hash = req.params[paramName] || req.body[paramName] || req.query[paramName];
    const v = validateTransactionHash(hash);
    if (!v.valid) return next(Object.assign(new Error(v.error), { code: v.code, status: 400 }));
    if (req.params[paramName]) req.params[paramName] = v.normalized;
    if (req.body[paramName])   req.body[paramName]   = v.normalized;
    if (req.query[paramName])  req.query[paramName]  = v.normalized;
    next();
  };
}

function validateTransactionHashes(hashes) {
  if (!Array.isArray(hashes)) return { valid: false, errors: ['Input must be an array'], normalized: [] };
  const results = hashes.map((h, i) => ({ i, ...validateTransactionHash(h) }));
  return {
    valid: results.every((r) => r.valid),
    errors: results.filter((r) => !r.valid).map((r) => `Hash at index ${r.i}: ${r.error}`),
    normalized: results.filter((r) => r.valid).map((r) => r.normalized),
  };
}

function sanitizeHash(hash) {
  const v = validateTransactionHash(hash);
  return v.valid ? v.normalized : null;
}

module.exports = { validateTransactionHash, validateHashMiddleware, validateTransactionHashes, sanitizeHash, STELLAR_HASH_REGEX };
