const Student = require('../models/studentModel');

/**
 * Generate a unique student ID of the form STU-XXXXXX
 * (6 random uppercase alphanumeric characters, e.g. "STU-A3BZ9Q").
 *
 * Format details:
 *   - Prefix  : "STU-"  (4 chars)
 *   - Suffix  : 6 chars from [A-Z0-9]  (36^6 ≈ 2.18 billion combinations)
 *   - Total   : 10 characters — well within the 28-char Stellar memo limit.
 *
 * Uniqueness is guaranteed within the given school via a retry loop.
 * The function retries up to `maxAttempts` times before throwing
 * STUDENT_ID_GENERATION_FAILED, so callers never receive a raw duplicate-key
 * error from MongoDB.
 *
 * @param {number} maxAttempts - Maximum retry attempts (default: 5)
 * @param {string|null} schoolId  - School scope for the uniqueness check.
 *   When provided, only checks for duplicates within that school (matching
 *   the compound unique index { studentId, schoolId }). When omitted, checks
 *   globally (more conservative but still safe).
 * @returns {Promise<string>} Unique student ID string
 * @throws {Error} With code 'STUDENT_ID_GENERATION_FAILED' after exhausting all attempts
 */
async function generateStudentId(maxAttempts = 5, schoolId = null) {
  if (maxAttempts < 1) {
    throw Object.assign(
      new Error('maxAttempts must be at least 1'),
      { code: 'STUDENT_ID_GENERATION_FAILED' },
    );
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  for (let i = 0; i < maxAttempts; i++) {
    const suffix = Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');
    const id = `STU-${suffix}`;

    // Scope the existence check to the school when possible so we don't
    // unnecessarily reject IDs that are free within the target school.
    const existsQuery = schoolId ? { schoolId, studentId: id } : { studentId: id };
    const exists = await Student.exists(existsQuery);
    if (!exists) return id;
  }

  throw Object.assign(
    new Error(`Failed to generate a unique student ID after ${maxAttempts} attempts`),
    { code: 'STUDENT_ID_GENERATION_FAILED' },
  );
}

module.exports = { generateStudentId };
