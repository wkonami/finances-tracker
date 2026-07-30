const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mudar_ja';

function authMiddleware(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: 'Token não informado'
    });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      message: 'Token inválido'
    });
  }

  try {

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };

    next();

  } catch (error) {

    return res.status(401).json({
      message: 'Token expirado ou inválido'
    });

  }

}

module.exports = authMiddleware;