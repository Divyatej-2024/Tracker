const { json, requireAuth } = require('./_lib/auth');
const { getLogs, getApplications, getDocuments } = require('./_lib/storage');

async function exportAllData() {
  const logs = await getLogs();
  const applications = await getApplications();
  const documents = await getDocuments();

  return {
    exportDate: new Date().toISOString(),
    version: '1.0',
    data: {
      logs,
      applications,
      documentMetadata: documents.map(d => ({ id: d.id, name: d.name, mimeType: d.mimeType, createdAt: d.createdAt }))
    }
  };
}

function generateJSON(data) {
  return JSON.stringify(data, null, 2);
}

function generateCSV(data) {
  const rows = [['Type', 'Count', 'Details']];
  rows.push(['Logs', data.data.logs.length, `${data.data.logs.length} daily entries`]);
  rows.push(['Applications', data.data.applications.length, `${data.data.applications.filter(a => a.status === 'Offer').length} offers, ${data.data.applications.filter(a => a.status === 'Applied').length} applied`]);
  rows.push(['Documents', data.data.documentMetadata.length, `${data.data.documentMetadata.length} uploaded files`]);
  rows.push(['Export Date', data.exportDate, '']);
  
  return rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

module.exports = async function handler(req, res) {
  try {
    const auth = requireAuth(req);
    if (!auth) return json(res, 401, { error: 'Unauthorized' });

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return json(res, 405, { error: 'Method not allowed' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { format = 'json' } = body;

    const allData = await exportAllData();

    let content = '';
    let mimeType = 'application/json';
    let filename = 'career-pilot-export.json';

    if (format === 'json') {
      content = generateJSON(allData);
      filename = 'career-pilot-export.json';
      mimeType = 'application/json';
    } else if (format === 'csv') {
      content = generateCSV(allData);
      filename = 'career-pilot-export.csv';
      mimeType = 'text/csv';
    } else {
      return json(res, 400, { error: 'Unsupported format' });
    }

    return json(res, 200, {
      content,
      mimeType,
      filename,
      size: content.length
    });
  } catch (err) {
    return json(res, 400, { error: err.message || 'Request failed' });
  }
};
