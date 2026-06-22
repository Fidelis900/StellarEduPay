'use strict';

const PaymentIntent = require('../models/paymentIntentModel');
const logger = require('../utils/logger').child('SessionCleanupService');

const INTERVAL_MS = parseInt(process.env.SESSION_CLEANUP_INTERVAL_MS, 10) || 60 * 60 * 1000;
let _timer = null;
let _running = false;

async function cleanupExpiredSessions() {
  if (_running) return;
  _running = true;
  try {
    const result = await PaymentIntent.updateMany({ status: 'pending', expiresAt: { $lt: new Date() } }, { $set: { status: 'expired' } });
    if (result.modifiedCount > 0) logger.info('Expired sessions cleaned up', { count: result.modifiedCount });
  } catch (err) {
    logger.error('Session cleanup failed', { error: err.message });
  } finally {
    _running = false;
  }
}

function startSessionCleanupScheduler() {
  if (_timer) return;
  _timer = setInterval(cleanupExpiredSessions, INTERVAL_MS);
  _timer.unref();
}

function stopSessionCleanupScheduler() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

module.exports = { startSessionCleanupScheduler, stopSessionCleanupScheduler, cleanupExpiredSessions };
