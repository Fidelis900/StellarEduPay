'use strict';

function sendSuccess(res, data, message = null, statusCode = 200, meta = {}) {
  const response = { success: true, data };
  if (message) response.message = message;
  if (Object.keys(meta).length > 0) response.meta = meta;
  return res.status(statusCode).json(response);
}

function sendError(res, message, code = 'INTERNAL_ERROR', statusCode = 500, details = null) {
  const response = { success: false, error: { message, code } };
  if (details) response.error.details = details;
  return res.status(statusCode).json(response);
}

function sendPaginated(res, data, page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  return sendSuccess(res, data, null, 200, {
    pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  });
}

module.exports = { sendSuccess, sendError, sendPaginated };
