function errorHandler(error, req, res, next) {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must contain valid JSON' });
  }

  const databaseErrors = {
    ER_DUP_ENTRY: [409, 'That email, appointment reference, or doctor slot already exists'],
    ER_ROW_IS_REFERENCED_2: [409, 'This record has appointments and cannot be deleted'],
    ER_NO_REFERENCED_ROW_2: [404, 'The patient or doctor no longer exists'],
    ER_CHECK_CONSTRAINT_VIOLATED: [422, 'The request violates an appointment or payment rule'],
    ER_LOCK_DEADLOCK: [409, 'A simultaneous change conflicted with this request; please retry'],
    ER_LOCK_WAIT_TIMEOUT: [503, 'The database is busy; please retry'],
    ECONNREFUSED: [503, 'A required service is unavailable; please retry'],
  };
  if (databaseErrors[error.code]) {
    const [status, message] = databaseErrors[error.code];
    return res.status(status).json({ message });
  }

  const status = error.status || 500;

  if (status >= 500) {
    console.error(error.message);
  }

  res.status(status).json({
    message: status >= 500 && !error.status ? 'Internal server error' : error.message,
    ...(error.details || {}),
  });
}

module.exports = errorHandler;
