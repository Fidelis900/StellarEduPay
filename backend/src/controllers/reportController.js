'use strict';

const { generateReport, reportToCsv, getDashboardMetrics } = require('../services/reportService');
const { get, set, KEYS, TTL } = require('../cache');
const School = require('../models/schoolModel');

const ISO_8601 = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z)?$/;

async function getReport(req, res, next) {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    for (const [name, val] of [['startDate', startDate], ['endDate', endDate]]) {
      if (val && (!ISO_8601.test(val) || isNaN(Date.parse(val))))
        return next(Object.assign(new Error(`Invalid ${name} — must be ISO 8601`), { code: 'INVALID_DATE_FORMAT' }));
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate))
      return next(Object.assign(new Error('startDate must be before or equal to endDate'), { code: 'INVALID_DATE_FORMAT' }));

    const school = await School.findOne({ schoolId: req.schoolId }).lean();
    const timezone = school?.timezone || 'UTC';
    const cacheKey = KEYS.report(startDate, endDate);
    let report = get(cacheKey);
    if (report === undefined) { report = await generateReport({ schoolId: req.schoolId, startDate, endDate, timezone }); set(cacheKey, report, TTL.REPORT); }

    if (format === 'csv') {
      const parts = [startDate && `${startDate}`, endDate && `${endDate}`].filter(Boolean);
      const filename = parts.length === 2 ? `report-${parts[0]}-to-${parts[1]}.csv` : parts.length === 1 ? `report-${parts[0]}.csv` : 'report-all-time.csv';
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(reportToCsv(report));
    }

    res.json(report);
  } catch (err) { next(err); }
}

async function getDashboard(req, res, next) {
  try {
    const school = await School.findOne({ schoolId: req.schoolId }).lean();
    const cacheKey = `dashboard:${req.schoolId}`;
    let metrics = get(cacheKey);
    if (metrics === undefined) { metrics = await getDashboardMetrics({ schoolId: req.schoolId, timezone: school?.timezone || 'UTC' }); set(cacheKey, metrics, TTL.REPORT); }
    res.json(metrics);
  } catch (err) { next(err); }
}

module.exports = { getReport, getDashboard };
