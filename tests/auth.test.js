const assert = require('assert');
const { verifyPassword, createAuthToken, verifyToken } = require('../api/_lib/auth');

module.exports = function authTest() {
  process.env.APP_PASSWORD_HASH = require('crypto').createHash('sha256').update('test-password').digest('hex');
  process.env.TOKEN_SECRET = 'test-secret-key-1234567890';

  assert.strictEqual(verifyPassword('test-password'), true, 'Password should verify correctly');
  assert.strictEqual(verifyPassword('wrong-password'), false, 'Wrong password should fail verification');

  const token = createAuthToken();
  const payload = verifyToken(token);
  assert(payload && payload.role === 'user', 'Token payload should contain role user');
};
