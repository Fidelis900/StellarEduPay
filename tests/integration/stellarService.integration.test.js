'use strict';

/**
 * Stellar Service Integration Tests
 *
 * Runs real network calls against the Stellar testnet.
 * Opt in by setting STELLAR_INTEGRATION_TESTS=true.
 *
 * Run with:
 *   STELLAR_INTEGRATION_TESTS=true npx jest tests/integration/stellarService.integration.test.js --forceExit
 */

const ENABLED = process.env.STELLAR_INTEGRATION_TESTS === 'true';
const describeIf = ENABLED ? describe : describe.skip;

let StellarSdk, server;

if (ENABLED) {
  StellarSdk = require('@stellar/stellar-sdk');
  server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

  process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stellaredupay_integration_test';
  process.env.SCHOOL_WALLET_ADDRESS = process.env.SCHOOL_WALLET_ADDRESS || 'PLACEHOLDER';
  process.env.STELLAR_NETWORK = 'testnet';
}

describeIf('Stellar Service — real testnet integration', () => {
  test('Horizon testnet is reachable', async () => {
    const ledgers = await server.ledgers().order('desc').limit(1).call();
    expect(ledgers.records.length).toBe(1);
    expect(ledgers.records[0].sequence).toBeGreaterThan(0);
  }, 30000);

  test('can load a known testnet account', async () => {
    // Uses a well-known testnet account that always exists
    const account = await server
      .accounts()
      .accountId('GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN')
      .call();
    expect(account.id).toBeDefined();
  }, 30000);
});
