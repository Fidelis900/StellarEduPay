'use strict';

const rateLimit = require('express-rate-limit');

const RL_MSG = { error: 'Too many requests, please try again later.', code: 'RATE_LIMIT_EXCEEDED' };
const rl = (windowMs, max, message = RL_MSG) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message });

const generalLimiter       = rl(15 * 60 * 1000, 100);
const strictLimiter        = rl(15 * 60 * 1000, 10);
const verifyLimiter        = rl(60 * 1000, parseInt(process.env.VERIFY_RATE_LIMIT || '10', 10));
const reminderTriggerLimiter = rl(60 * 60 * 1000, 5, { error: 'Too many reminder requests. Please wait.', code: 'RATE_LIMIT_EXCEEDED' });
const bulkImportLimiter    = rl(60 * 60 * 1000, 5, { error: 'Maximum 5 bulk imports per hour.', code: 'RATE_LIMIT_EXCEEDED' });

module.exports = { generalLimiter, strictLimiter, verifyLimiter, reminderTriggerLimiter, bulkImportLimiter };
