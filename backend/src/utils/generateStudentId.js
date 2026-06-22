'use strict';

const Student = require('../models/studentModel');
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

async function generateStudentId(maxAttempts = 5, schoolId = null) {
  for (let i = 0; i < maxAttempts; i++) {
    const suffix = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * 36)]).join('');
    const id = `STU-${suffix}`;
    const query = schoolId ? { schoolId, studentId: id } : { studentId: id };
    if (!await Student.exists(query)) return id;
  }
  throw Object.assign(
    new Error(`Failed to generate unique student ID after ${maxAttempts} attempts`),
    { code: 'STUDENT_ID_GENERATION_FAILED' },
  );
}

module.exports = { generateStudentId };
