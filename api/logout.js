const { json, parseAuthHeader, invalidateToken, verifyToken } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];

  if (!token || !verifyToken(token)) {
    return json(res, 200, { ok: true });
  }

  invalidateToken(token);
  return json(res, 200, { ok: true });
};
