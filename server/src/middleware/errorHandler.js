module.exports = function errorHandler(error, _request, response, _next) {
  console.error(error);
  const status = error.name === 'CastError' ? 400 : 500;
  return response.status(status).json({ error: status === 400 ? 'Invalid resource id' : 'Internal server error' });
};