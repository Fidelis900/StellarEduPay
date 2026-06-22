'use strict';

const logger = require('../utils/logger').child('AlertService');

async function sendAdminAlert(message, details = {}) {
  logger.error(`[ALERT] ${message}`, details);
}

module.exports = { sendAdminAlert };
