'use strict';

function parseAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
  if (raw === '*') {
    if (process.env.NODE_ENV === 'production') throw new Error('ALLOWED_ORIGIN wildcard (*) is not permitted in production');
    return '*';
  }
  const origins = raw.split(',').map((o) => o.trim()).filter(Boolean);
  for (const origin of origins) {
    try { new URL(origin); } catch { throw new Error(`ALLOWED_ORIGIN contains invalid URL: "${origin}"`); }
  }
  return origins.length === 1 ? origins[0] : origins;
}

module.exports = { parseAllowedOrigins };
