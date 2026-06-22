'use strict';

const { checkConsistency } = require('./consistencyService');
const School = require('../models/schoolModel');
const logger = require('../utils/logger').child('ConsistencyScheduler');

const INTERVAL_MS = parseInt(process.env.CONSISTENCY_CHECK_INTERVAL_MS, 10) || 5 * 60 * 1000;
let _timer = null;

async function runCheck() {
  try {
    if (!await School.countDocuments({ isActive: true })) return;
    const report = await checkConsistency();
    if (report.mismatchCount > 0) {
      logger.warn(`${report.mismatchCount} mismatch(es) detected`, { mismatches: report.mismatches });
    }
  } catch (err) {
    logger.error('Consistency check failed', { error: err.message });
  }
}

function startConsistencyScheduler() {
  if (_timer) return;
  runCheck();
  _timer = setInterval(runCheck, INTERVAL_MS);
}

function stopConsistencyScheduler() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

module.exports = { startConsistencyScheduler, stopConsistencyScheduler };
