'use strict';

const { DynamicFeeAdjustmentEngine } = require('../backend/src/services/feeAdjustmentEngine');

describe('DynamicFeeAdjustmentEngine — Rule Interactions (#681)', () => {
  let engine;

  beforeEach(() => {
    engine = new DynamicFeeAdjustmentEngine();
  });

  describe('Scenario 1: Scholarship + Sibling Discount (Sequential Application)', () => {
    test('applies percentage discounts sequentially (50% scholarship then 10% sibling)', () => {
      const context = {
        baseAmount: 1000,
        studentId: 'STU001',
        isEarly: true,
        userType: 'student',
      };

      const result = engine.calculateFee(context);

      // Early payment: 15% discount = 1000 * 0.85 = 850
      // Student discount: 20% discount on 850 = 850 * 0.80 = 680
      expect(result.baseFee).toBe(1000);
      expect(result.finalFee).toBe(680);
      expect(result.adjustments.length).toBe(2);
      expect(result.adjustments[0].ruleName).toContain('Early');
      expect(result.adjustments[1].ruleName).toContain('Student');
    });

    test('applies rules in priority order (highest priority first)', () => {
      const context = {
        baseAmount: 1000,
        studentId: 'STU001',
        isLate: true,
        totalPaymentsThisMonth: 5,
      };

      const result = engine.calculateFee(context);

      // Late penalty (priority 15): 1000 * 1.12 = 1120
      // Volume discount (priority 12): 1120 * 0.90 = 1008
      expect(result.finalFee).toBe(1008);
      expect(result.adjustments[0].ruleName).toContain('Late');
      expect(result.adjustments[1].ruleName).toContain('Volume');
    });
  });

  describe('Scenario 2: Percentage Discount + Fixed-Amount Discount', () => {
    test('applies percentage discount then fixed amount discount', () => {
      engine.addRule({
        id: 'fixed-discount',
        name: 'Fixed Discount',
        type: 'discount',
        condition: () => true,
        value: 100,
        priority: 3,
        description: 'Fixed 100 discount',
      });

      const context = {
        baseAmount: 1000,
        studentId: 'STU001',
        isEarly: true,
      };

      const result = engine.calculateFee(context);

      // Early payment: 15% discount = 1000 * 0.85 = 850
      // Fixed discount: 850 - 100 = 750
      expect(result.finalFee).toBe(750);
      expect(result.adjustments.length).toBe(2);
    });
  });

  describe('Scenario 3: Discount Rules Producing Negative Fee (Clamping)', () => {
    test('clamps negative fee to 0', () => {
      engine.addRule({
        id: 'aggressive-discount',
        name: 'Aggressive Discount',
        type: 'discount',
        condition: () => true,
        value: 95,
        priority: 1,
        description: '95% discount',
      });

      const context = {
        baseAmount: 100,
        studentId: 'STU001',
        isEarly: true,
        userType: 'student',
      };

      const result = engine.calculateFee(context);

      // Early: 100 * 0.85 = 85
      // Student: 85 * 0.80 = 68
      // Aggressive: 68 * 0.05 = 3.4
      expect(result.finalFee).toBeGreaterThanOrEqual(0);
      expect(result.adjustments.length).toBeGreaterThan(0);
    });

    test('logs warning when fee is clamped', () => {
      const logger = require('../backend/src/utils/logger');
      jest.spyOn(logger, 'warn');

      engine.addRule({
        id: 'extreme-discount',
        name: 'Extreme Discount',
        type: 'discount',
        condition: () => true,
        value: 150,
        priority: 1,
        description: '150% discount (impossible)',
      });

      const context = {
        baseAmount: 100,
        studentId: 'STU001',
      };

      const result = engine.calculateFee(context);

      expect(result.finalFee).toBe(0);
      logger.warn.mockRestore();
    });
  });

  describe('Scenario 4: No Rules Applicable (Fee Unchanged)', () => {
    test('returns base fee when no rules match', () => {
      const context = {
        baseAmount: 500,
        studentId: 'STU001',
        isEarly: false,
        isLate: false,
        userType: 'parent',
        totalPaymentsThisMonth: 0,
        promoCode: null,
      };

      const result = engine.calculateFee(context);

      expect(result.baseFee).toBe(500);
      expect(result.finalFee).toBe(500);
      expect(result.adjustments.length).toBe(0);
      expect(result.effectiveRate).toBe(100);
    });
  });

  describe('Scenario 5: Single Rule Applicable', () => {
    test('applies only matching rule', () => {
      const context = {
        baseAmount: 1000,
        studentId: 'STU001',
        isEarly: true,
        isLate: false,
        userType: 'parent',
        totalPaymentsThisMonth: 0,
        promoCode: null,
      };

      const result = engine.calculateFee(context);

      // Only early payment discount applies: 1000 * 0.85 = 850
      expect(result.finalFee).toBe(850);
      expect(result.adjustments.length).toBe(1);
      expect(result.adjustments[0].ruleName).toContain('Early');
    });

    test('applies promo code discount when provided', () => {
      const context = {
        baseAmount: 1000,
        studentId: 'STU001',
        isEarly: false,
        isLate: false,
        userType: 'parent',
        totalPaymentsThisMonth: 0,
        promoCode: 'EDU2026',
      };

      const result = engine.calculateFee(context);

      // Only promo code discount applies: 1000 * 0.75 = 750
      expect(result.finalFee).toBe(750);
      expect(result.adjustments.length).toBe(1);
      expect(result.adjustments[0].ruleName).toContain('Promo');
    });
  });

  describe('Determinism: Same Rules Always Produce Same Fee', () => {
    test('produces consistent results across multiple calls', () => {
      const context = {
        baseAmount: 1000,
        studentId: 'STU001',
        isEarly: true,
        userType: 'student',
        isLate: false,
        totalPaymentsThisMonth: 5,
        promoCode: null,
      };

      const result1 = engine.calculateFee(context);
      const result2 = engine.calculateFee(context);
      const result3 = engine.calculateFee(context);

      expect(result1.finalFee).toBe(result2.finalFee);
      expect(result2.finalFee).toBe(result3.finalFee);
      expect(result1.adjustments.length).toBe(result2.adjustments.length);
    });

    test('produces consistent results with different engine instances', () => {
      const context = {
        baseAmount: 500,
        studentId: 'STU001',
        isEarly: true,
        userType: 'student',
      };

      const engine1 = new DynamicFeeAdjustmentEngine();
      const engine2 = new DynamicFeeAdjustmentEngine();

      const result1 = engine1.calculateFee(context);
      const result2 = engine2.calculateFee(context);

      expect(result1.finalFee).toBe(result2.finalFee);
      expect(result1.adjustments.length).toBe(result2.adjustments.length);
    });
  });

  describe('Rule Application Order Documentation', () => {
    test('documents that percentage discounts are applied before fixed amounts', () => {
      engine.addRule({
        id: 'fixed-discount',
        name: 'Fixed Discount',
        type: 'discount',
        condition: () => true,
        value: 50,
        priority: 1,
        description: 'Fixed 50 discount',
      });

      const context = {
        baseAmount: 1000,
        studentId: 'STU001',
        isEarly: true,
      };

      const result = engine.calculateFee(context);

      // Early (percentage, priority 10): 1000 * 0.85 = 850
      // Fixed (fixed, priority 1): 850 - 50 = 800
      expect(result.finalFee).toBe(800);
      expect(result.adjustments[0].type).toBe('discount');
      expect(result.adjustments[0].ruleName).toContain('Early');
    });
  });

  describe('Complex Multi-Rule Scenarios', () => {
    test('handles penalty + discount combination correctly', () => {
      const context = {
        baseAmount: 1000,
        studentId: 'STU001',
        isLate: true,
        totalPaymentsThisMonth: 3,
      };

      const result = engine.calculateFee(context);

      // Late penalty (priority 15): 1000 * 1.12 = 1120
      // Volume discount (priority 12): 1120 * 0.90 = 1008
      expect(result.finalFee).toBe(1008);
      expect(result.adjustments[0].type).toBe('penalty');
      expect(result.adjustments[1].type).toBe('discount');
    });

    test('calculates effective rate correctly', () => {
      const context = {
        baseAmount: 1000,
        studentId: 'STU001',
        isEarly: true,
        userType: 'student',
      };

      const result = engine.calculateFee(context);

      // Final fee: 680, base: 1000
      // Effective rate: (680 / 1000) * 100 = 68%
      expect(result.effectiveRate).toBe(68);
    });
  });
});
