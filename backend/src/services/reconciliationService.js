'use strict';

const Student = require('../models/studentModel');
const Payment = require('../models/paymentModel');
const logger = require('../utils/logger').child('ReconciliationService');

const INTERVAL_MS = parseInt(process.env.RECONCILIATION_INTERVAL_MS, 10) || 24 * 60 * 60 * 1000;
let _timer = null;

async function reconcileAll(schoolId) {
  const students = await Student.find(schoolId ? { schoolId } : {}).lean();
  let fixed = 0, errors = 0;

  for (const s of students) {
    try {
      const [agg] = await Payment.aggregate([
        { $match: { schoolId: s.schoolId, studentId: s.studentId, status: 'SUCCESS', deletedAt: null } },
        { $group: { _id: null, computedTotal: { $sum: '$amount' } } },
      ]);
      const computed = agg?.computedTotal ?? 0;
      if (Math.abs(computed - (s.totalPaid || 0)) > 0.0000001) {
        logger.warn('Reconciliation mismatch — correcting', { schoolId: s.schoolId, studentId: s.studentId, diff: computed - (s.totalPaid || 0) });
        await Student.findOneAndUpdate(
          { schoolId: s.schoolId, studentId: s.studentId },
          { totalPaid: computed, remainingBalance: Math.max(0, s.feeAmount - computed), feePaid: computed >= s.feeAmount },
        );
        fixed++;
      }
    } catch (err) {
      errors++;
      logger.error('Reconciliation error', { studentId: s.studentId, error: err.message });
    }
  }

  logger.info('Reconciliation complete', { checked: students.length, fixed, errors });
  return { checked: students.length, fixed, errors };
}

function startReconciliationScheduler() {
  if (_timer) return;
  _timer = setInterval(async () => { try { await reconcileAll(); } catch (err) { logger.error('Scheduler error', { error: err.message }); } }, INTERVAL_MS);
  if (_timer.unref) _timer.unref();
}

function stopReconciliationScheduler() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

module.exports = { reconcileAll, startReconciliationScheduler, stopReconciliationScheduler };
