'use strict';

const logger = require('./logger');

function startHeapMonitoring() {
  const { heap_size_limit: max } = require('v8').getHeapStatistics();
  const threshold = max * 0.8;
  const iv = setInterval(() => {
    const used = process.memoryUsage().heapUsed;
    if (used > threshold) {
      logger.warn('HEAP_USAGE_WARNING', {
        heapUsedMB: Math.round(used / 1024 / 1024),
        maxHeapSizeMB: Math.round(max / 1024 / 1024),
        usagePercent: Math.round((used / max) * 100),
      });
    }
  }, 30000);
  iv.unref();
}

module.exports = { startHeapMonitoring };
