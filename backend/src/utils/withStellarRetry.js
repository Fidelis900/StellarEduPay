'use strict';

const logger = require('./logger').child('StellarRetry');

const MAX_ATTEMPTS = parseInt(process.env.STELLAR_CALL_RETRY_ATTEMPTS, 10) || 3;
const BASE_DELAY   = parseInt(process.env.STELLAR_CALL_RETRY_DELAY_MS, 10) || 1000;
const MAX_DELAY    = 10000;

const NETWORK_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN']);

function getStatus(err) {
  return err.response?.status || err.response?.statusCode || err.status || err.statusCode;
}

function isTransient(err) {
  const s = getStatus(err);
  return NETWORK_CODES.has(err.code) || /timeout|network|socket hang up/i.test(err.message || '') || s === 429 || (s >= 500 && s < 600);
}

function classifyHorizonError(err, context = '') {
  const s = getStatus(err);
  if (s === 404) return Object.assign(new Error(`${context || 'Transaction'} not found on the Stellar network`), { code: 'NOT_FOUND', status: 404 });
  if (s === 429 || (s >= 500 && s < 600) || NETWORK_CODES.has(err.code) || /timeout|network|socket hang up/i.test(err.message || ''))
    return Object.assign(new Error('Stellar Horizon is temporarily unavailable. Please retry shortly.'), { code: 'HORIZON_UNAVAILABLE', status: 503 });
  if (err.code && err.status) return err;
  return Object.assign(new Error(err.message || 'Unexpected Stellar network error'), { code: 'STELLAR_NETWORK_ERROR', status: 502 });
}

async function withStellarRetry(fn, opts = {}) {
  const maxAttempts = opts.maxAttempts || MAX_ATTEMPTS;
  const baseDelay   = opts.baseDelay   || BASE_DELAY;
  const label       = opts.label       || 'StellarCall';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isTransient(err) || attempt === maxAttempts) throw err;
      const delay = Math.min(baseDelay * 2 ** (attempt - 1), MAX_DELAY);
      const wait  = delay + Math.floor(Math.random() * delay * 0.3);
      logger.warn(`${label} attempt ${attempt}/${maxAttempts} failed — retrying in ${wait}ms`, { error: err.message });
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

module.exports = { withStellarRetry, isTransient, classifyHorizonError };
