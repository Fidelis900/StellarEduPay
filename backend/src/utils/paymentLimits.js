'use strict';

const { MIN_PAYMENT_AMOUNT, MAX_PAYMENT_AMOUNT } = require('../config');

function validatePaymentAmount(amount) {
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0)
    return { valid: false, error: 'Payment amount must be a valid positive number', code: 'INVALID_AMOUNT' };
  if (amount < MIN_PAYMENT_AMOUNT)
    return { valid: false, error: `Payment amount ${amount} is below the minimum of ${MIN_PAYMENT_AMOUNT}`, code: 'AMOUNT_TOO_LOW' };
  if (amount > MAX_PAYMENT_AMOUNT)
    return { valid: false, error: `Payment amount ${amount} exceeds the maximum of ${MAX_PAYMENT_AMOUNT}`, code: 'AMOUNT_TOO_HIGH' };
  return { valid: true };
}

function validatePaymentAmountAgainstFee(paymentAmount, feeAmount, maxPaymentMultiplier = 3.0) {
  if (typeof paymentAmount !== 'number' || isNaN(paymentAmount) || paymentAmount <= 0)
    return { valid: false, error: 'Payment amount must be a valid positive number', code: 'INVALID_AMOUNT' };
  if (typeof feeAmount !== 'number' || isNaN(feeAmount) || feeAmount <= 0)
    return { valid: false, error: 'Fee amount must be a valid positive number', code: 'INVALID_FEE' };
  const maxAllowed = feeAmount * maxPaymentMultiplier;
  if (paymentAmount > maxAllowed)
    return { valid: false, error: `Payment amount ${paymentAmount} exceeds the maximum of ${maxAllowed} (${maxPaymentMultiplier}× the fee)`, code: 'AMOUNT_TOO_HIGH' };
  return { valid: true };
}

function getPaymentLimits() {
  return { min: MIN_PAYMENT_AMOUNT, max: MAX_PAYMENT_AMOUNT };
}

module.exports = { validatePaymentAmount, validatePaymentAmountAgainstFee, getPaymentLimits };
