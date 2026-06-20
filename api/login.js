const { createAuthToken, json, verifyPassword } = require('./_lib/auth');

// Basic in-memory rate limiter to mitigate brute-force attempts. This is
// intentionally simple and per-instance; in production a shared store
// (Redis, DB) or edge provider rate-limiting should be used.
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const attempts = new Map();

function getIp(req) {
  return (req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || (req.connection && req.connection.remoteAddress) || 'unknown';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const ip = getIp(req);
  const now = Date.now();
  const entry = attempts.get(ip) || { count: 0, first: now };

  // Reset window if expired
  if (now - entry.first > RATE_LIMIT_WINDOW) {
    entry.count = 0;
    entry.first = now;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return json(res, 429, { error: 'Too many failed attempts. Try again later.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const password = String(body.password || '');

    if (!password) {
      return json(res, 400, { error: 'Password is required' });
    }

    if (!verifyPassword(password)) {
      // increment failed attempts
      entry.count = (entry.count || 0) + 1;
      attempts.set(ip, entry);
      return json(res, 401, { error: 'Invalid credentials' });
    }

    // Successful login: clear attempts
    attempts.delete(ip);
    const token = createAuthToken();
    return json(res, 200, { token });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Internal server error' });
  }
};
