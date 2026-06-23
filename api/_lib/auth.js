const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const tokenBlacklist = new Set();

function json(res, statusCode, payload) {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(payload));
}

function getEnvOrThrow(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function createAuthToken() {
  const secret = getEnvOrThrow('TOKEN_SECRET');
  const payload = {
    role: 'user'
  };
  return jwt.sign(payload, secret, { expiresIn: TOKEN_TTL_MS / 1000 });
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  if (tokenBlacklist.has(token)) return null;

  try {
    const secret = getEnvOrThrow('TOKEN_SECRET');
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

function invalidateToken(token) {
  if (!token || typeof token !== 'string') return false;
  tokenBlacklist.add(token);
  return true;
}

function parseAuthHeader(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

function requireAuth(req) {
  const token = parseAuthHeader(req);
  return verifyToken(token);
}

function verifyPassword(candidate) {
  const hash = getEnvOrThrow('APP_PASSWORD_HASH');
  const candidateHash = sha256(candidate || '');

  const a = Buffer.from(hash, 'utf8');
  const b = Buffer.from(candidateHash, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = {
  createAuthToken,
  json,
  requireAuth,
  verifyPassword,
  invalidateToken,
  verifyToken
};
