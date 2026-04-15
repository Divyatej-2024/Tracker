const crypto = require('crypto');

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

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

function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [body, providedSig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(body).digest('base64url');

  if (providedSig !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload || typeof payload !== 'object') return null;
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function createAuthToken() {
  const secret = getEnvOrThrow('TOKEN_SECRET');
  const payload = {
    role: 'user',
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS
  };
  return signToken(payload, secret);
}

function parseAuthHeader(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

function requireAuth(req) {
  const secret = getEnvOrThrow('TOKEN_SECRET');
  const token = parseAuthHeader(req);
  const payload = verifyToken(token, secret);
  return payload;
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
  verifyPassword
};
