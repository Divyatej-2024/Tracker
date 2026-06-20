const { json, requireAuth } = require('./_lib/auth');
const { getDocuments, addDocument, deleteDocument, getDocumentFile } = require('./_lib/storage');

module.exports = async function handler(req, res) {
  try {
    const auth = requireAuth(req);
    if (!auth) return json(res, 401, { error: 'Unauthorized' });

    if (req.method === 'GET' && req.query && req.query.download) {
      const data = await getDocumentFile(req.query.download);
      if (!data) return json(res, 404, { error: 'Not found' });
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', 'attachment');
      res.send(data);
      return;
    }

    if (req.method === 'GET') {
      const docs = await getDocuments();
      return json(res, 200, { documents: docs });
    }

    if (req.method === 'POST') {
      // Expect JSON body { name, mimeType, contentBase64 }
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      if (!body.name || !body.contentBase64) return json(res, 400, { error: 'Invalid payload' });
      const doc = await addDocument(body);
      return json(res, 201, { document: doc });
    }

    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = body.id || (req.query && req.query.id);
      if (!id) return json(res, 400, { error: 'Missing id' });
      await deleteDocument(id);
      return json(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    return json(res, 400, { error: error.message || 'Request failed' });
  }
};
