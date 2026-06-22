'use strict';

/**
 * Jest setup file — intercepts outbound HTTP/HTTPS requests to non-localhost
 * hosts during unit tests, preventing accidental real network calls.
 *
 * Excluded when STELLAR_INTEGRATION_TESTS=true.
 */

if (process.env.STELLAR_INTEGRATION_TESTS !== 'true') {
  const http = require('http');
  const https = require('https');

  const LOCALHOST_RE = /^(localhost|127\.\d+\.\d+\.\d+|::1)(:\d+)?$/;

  function wrapRequest(original, protocol) {
    return function (options, ...rest) {
      const hostname =
        typeof options === 'string' || options instanceof URL
          ? new URL(options).hostname
          : options?.hostname || options?.host || '';

      if (hostname && !LOCALHOST_RE.test(hostname)) {
        throw new Error(
          `[blockRealHttp] Real ${protocol.toUpperCase()} request to "${hostname}" blocked in unit tests. ` +
          `Mock the module making this request, or set STELLAR_INTEGRATION_TESTS=true to opt in.`
        );
      }
      return original.call(this, options, ...rest);
    };
  }

  http.request = wrapRequest(http.request, 'http');
  http.get = wrapRequest(http.get, 'http');
  https.request = wrapRequest(https.request, 'https');
  https.get = wrapRequest(https.get, 'https');
}
