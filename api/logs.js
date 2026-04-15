const { json, requireAuth } = require('./_lib/auth');
const { getLogs, addLog } = require('./_lib/storage');

module.exports = async function handler(req, res) {
  try {
    const auth = requireAuth(req);
    if (!auth) {
      return json(res, 401, { error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const logs = await getLogs();
      return json(res, 200, { logs });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const newLog = await addLog(body);
      return json(res, 201, { log: newLog });
    }

    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    return json(res, 400, { error: error.message || 'Request failed' });
  }
};
