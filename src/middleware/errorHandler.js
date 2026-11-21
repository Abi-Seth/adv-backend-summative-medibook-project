function errorHandler(error, req, res, next) {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must contain valid JSON' });
  }

  const status = error.status || 500;

  if (status >= 500) {
    console.error(error.message);
  }

  res.status(status).json({
    message: status >= 500 ? 'Internal server error' : error.message,
  });
}

module.exports = errorHandler;
