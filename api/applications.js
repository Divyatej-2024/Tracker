const { json, requireAuth } = require('./_lib/auth');
const { getApplications, addApplication, updateApplication, deleteApplication } = require('./_lib/storage');

module.exports = async function handler(req, res) {
  try {
    const auth = requireAuth(req);
    if (!auth) {
      return json(res, 401, { error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const apps = await getApplications();
      return json(res, 200, { applications: apps });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const app = await addApplication(body);
      return json(res, 201, { application: app });
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = body.id || (req.query && req.query.id);
      if (!id) return json(res, 400, { error: 'Missing id' });
      const updated = await updateApplication(id, body);
      return json(res, 200, { application: updated });
    }

    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = body.id || (req.query && req.query.id);
      if (!id) return json(res, 400, { error: 'Missing id' });
      await deleteApplication(id);
      return json(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    return json(res, 400, { error: error.message || 'Request failed' });
  }
};
