'use strict';

process.env.MONGO_URI = 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = 'test-secret';
process.env.SCHOOL_WALLET_ADDRESS = 'GTEST123';
process.env.REDIS_HOST = 'localhost'; // Just to pass config

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn(),
  QueueEvents: jest.fn(),
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn(),
  }));
});

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Student = require('../backend/src/models/studentModel');
const Payment = require('../backend/src/models/paymentModel');
const { ConcurrentPaymentProcessor } = require('../backend/src/services/concurrentPaymentProcessor');
const { transactionManager, CONCURRENCY_STRATEGY } = require('../backend/src/services/transactionManager');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Student.deleteMany({});
  await Payment.deleteMany({});
  // Wait, VersionCounter for locks
  if (mongoose.models.VersionCounter) {
      await mongoose.models.VersionCounter.deleteMany({});
  }
});

describe('Concurrent Allocation Atomicity', () => {
  test('N simultaneous payments are correctly allocated and yield exactly correct balance', async () => {
    const processor = new ConcurrentPaymentProcessor({
      idempotencyTtlMs: 60000,
      maxRequestsPerSecond: 100,
      lockStrategy: 'pessimistic',
      lockTimeoutMs: 30000,
      maxRetries: 3,
      maxQueueDepth: 100,
    });

    const studentId = 'CONC-STU-001';
    await Student.create({
      studentId,
      schoolId: 'SCHOOL-1',
      feeAmount: 500,
      totalPaid: 0,
      remainingBalance: 500,
      feePaid: false,
    });

    // Fire 5 payments of 50 concurrently
    const numPayments = 5;
    const amount = 50;

    const promises = [];
    for (let i = 0; i < numPayments; i++) {
      promises.push(
        processor.processPayment(
          { amount },
          { studentId, amount, txHash: `hash-${i}` }
        )
      );
    }

    const results = await Promise.all(promises);

    const successful = results.filter((r) => r.success);
    expect(successful.length).toBe(numPayments);

    const student = await Student.findOne({ studentId });
    expect(student.totalPaid).toBe(numPayments * amount); // 250
    expect(student.remainingBalance).toBe(500 - (numPayments * amount)); // 250
    expect(student.feePaid).toBe(false);

    const payments = await Payment.find({ studentId });
    expect(payments.length).toBe(numPayments);
    
    // Test negative balance
    const largeAmount = 400;
    const resultLarge = await processor.processPayment({ amount: largeAmount }, { studentId, amount: largeAmount, txHash: 'hash-large' });
    expect(resultLarge.success).toBe(true);
    
    const studentFinal = await Student.findOne({ studentId });
    expect(studentFinal.totalPaid).toBe(250 + 400); // 650
    expect(studentFinal.remainingBalance).toBe(0); // Should be clamped to 0, not negative
    expect(studentFinal.feePaid).toBe(true);
  });
});
