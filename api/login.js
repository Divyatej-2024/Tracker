const { createAuthToken, json, verifyPassword } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const password = String(body.password || '');

    if (!password) {
      return json(res, 400, { error: 'Password is required' });
    }

    if (!verifyPassword(password)) {
      return json(res, 401, { error: 'Invalid credentials' });
    }

    const token = createAuthToken();
    return json(res, 200, { token });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Internal server error' });
  }
};
