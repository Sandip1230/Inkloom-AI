const jwt = require('jsonwebtoken');

function requireAuth(request, response, next) {
  const authorization = request.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({ error: 'Sign in to access workspace administration.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.id || payload.purpose) {
      return response.status(401).json({ error: 'This token cannot access workspace administration.' });
    }
    request.userId = payload.id;
    return next();
  } catch (error) {
    return response.status(401).json({ error: 'Your session is invalid or has expired. Please sign in again.' });
  }
}

module.exports = requireAuth;
