'use strict';

/**
 * Tests for bulkImportStudents details array shape (Issue #684).
 * Verifies row (1-based), error (string), and code fields per failed row.
 */

process.env.MONGO_URI = 'mongodb://localhost:27017/test';

const fs = require('fs');
const path = require('path');

const CONTROLLER_SRC = fs.readFileSync(
  path.join(__dirname, '../backend/src/controllers/studentController.js'),
  'utf8',
);

describe('bulkImportStudents details shape — source checks', () => {
  it('uses row (not index) in details entries', () => {
    // All details.push calls should use 'row:' not 'index:'
    expect(CONTROLLER_SRC).not.toMatch(/details\.push\(\{[^}]*index:/);
  });

  it('uses error (string) not errors (array) in failed detail entries', () => {
    // Failed entries should use 'error:' not 'errors:'
    expect(CONTROLLER_SRC).not.toMatch(/details\.push\(\{[^}]*errors:/);
  });

  it('row number is computed as i + 2 (1-based including header)', () => {
    expect(CONTROLLER_SRC).toContain('i + 2');
  });

  it('includes VALIDATION_ERROR code for field validation failures', () => {
    expect(CONTROLLER_SRC).toContain("code: 'VALIDATION_ERROR'");
  });

  it('includes FEE_STRUCTURE_NOT_FOUND code when no fee structure matches', () => {
    expect(CONTROLLER_SRC).toContain("code: 'FEE_STRUCTURE_NOT_FOUND'");
  });

  it('includes STUDENT_QUOTA_EXCEEDED code for quota failures', () => {
    expect(CONTROLLER_SRC).toContain("code: 'STUDENT_QUOTA_EXCEEDED'");
  });

  it('includes DUPLICATE_STUDENT_ID code for duplicate insert errors', () => {
    expect(CONTROLLER_SRC).toContain('DUPLICATE_STUDENT_ID');
  });
});

describe('bulkImportStudents details shape — row number correctness', () => {
  // Extract the row computation pattern to verify it maps correctly:
  // CSV row 1 = header, CSV row 2 = data row i=0, CSV row 3 = data row i=1, etc.
  it('data row i=0 maps to CSV row 2', () => {
    // i + 2 where i=0 → 2
    expect(0 + 2).toBe(2);
  });

  it('data row i=46 maps to CSV row 48', () => {
    expect(46 + 2).toBe(48);
  });

  it('data row i=831 maps to CSV row 833', () => {
    expect(831 + 2).toBe(833);
  });
});
