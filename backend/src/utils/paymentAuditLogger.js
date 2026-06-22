'use strict';

const { logAudit } = require('../services/auditService');

/**
 * Creates a scoped audit logger for payment_verify actions.
 * Reduces the boilerplate of repeating schoolId, action, performedBy,
 * targetId, targetType, ipAddress, and userAgent on every logAudit call.
 */
function makePaymentAuditLogger(req, schoolId, targetId) {
  const performedBy = req.user?.email || req.user?.id || 'anonymous';
  const ipAddress = req.ip || req.connection?.remoteAddress || null;
  const userAgent = req.get('user-agent') || null;

  const log = (result, details, errorMessage) =>
    logAudit({
      schoolId,
      action: 'payment_verify',
      performedBy,
      targetId,
      targetType: 'payment',
      details,
      result,
      errorMessage,
      ipAddress,
      userAgent,
    });

  return {
    success: (details) => log('success', details, undefined),
    failure: (errorMessage, details = {}) => log('failure', details, errorMessage),
  };
}

module.exports = { makePaymentAuditLogger };
