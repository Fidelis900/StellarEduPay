'use strict';

const svc = require('../services/bullMQRetryService');

const wrap = (fn) => async (req, res) => {
  try { res.json({ success: true, data: await fn(req) }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

const getStats    = wrap(() => svc.getRetryQueueStats());
const getHealth   = async (req, res) => { try { const h = await svc.getHealthStatus(); res.status(h.healthy ? 200 : 503).json({ success: true, data: h }); } catch (err) { res.status(500).json({ success: false, error: err.message }); } };
const getJob      = wrap((req) => svc.getJobDetails(req.params.jobId));
const getJobs     = wrap((req) => svc.getJobsByState(req.params.state, parseInt(req.query.limit) || 50).then((jobs) => ({ state: req.params.state, count: jobs.length, jobs })));
const manualRetry = wrap((req) => svc.retryJobImmediately(req.params.jobId));
const deleteJob   = wrap((req) => svc.removeJob(req.params.jobId));
const pause       = wrap(() => svc.pauseQueue());
const resume      = wrap(() => svc.resumeQueue());

async function queueTransaction(req, res) {
  const { transactionHash, studentId, memo, error, metadata } = req.body;
  if (!transactionHash) return res.status(400).json({ success: false, error: 'transactionHash is required' });
  try {
    const data = await svc.queueFailedTransaction(transactionHash, { studentId, memo, error: error ? new Error(error.message) : null, metadata });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
}

module.exports = { getStats, getHealth, getJob, getJobs, manualRetry, deleteJob, pause, resume, queueTransaction };
