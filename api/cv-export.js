const { json, requireAuth } = require('./_lib/auth');

function escapeHtml(text) {
  return String(text || '').replace(/[&"'<>]/g, m => ({'&':'&amp;','"':'&quot;',"'":"&#39;","<":"&lt;",">":"&gt;"})[m]);
}

function generateMarkdown(profile) {
  const lines = [
    `# ${profile.name || 'CV'}`,
    `${profile.email || ''} | ${profile.phone || ''}`,
    '',
    '## Profile',
    profile.summary || 'Professional summary',
    '',
    '## Skills',
    (profile.skills || []).map(s => `- ${s}`).join('\n'),
    '',
    '## Experience',
    (profile.experience || []).map(exp => 
      `### ${exp.title} — ${exp.company}\n${exp.period}\n${exp.summary}`
    ).join('\n\n')
  ];
  return lines.join('\n');
}

function generateJSON(profile) {
  return JSON.stringify({
    exportDate: new Date().toISOString(),
    profile,
    version: '1.0'
  }, null, 2);
}

function generateCSV(profile, type = 'profile') {
  if (type === 'experience') {
    const rows = [['Title', 'Company', 'Period', 'Summary']];
    (profile.experience || []).forEach(exp => {
      rows.push([exp.title, exp.company, exp.period, exp.summary]);
    });
    return rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  }
  const rows = [
    ['Field', 'Value'],
    ['Name', profile.name || ''],
    ['Email', profile.email || ''],
    ['Phone', profile.phone || ''],
    ['Summary', profile.summary || ''],
    ['Skills', (profile.skills || []).join('; ')]
  ];
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
    const { profile, format = 'json', type = 'profile' } = body;

    if (!profile) return json(res, 400, { error: 'Profile required' });

    let content = '';
    let mimeType = 'application/json';
    let filename = `cv-export.${format}`;

    if (format === 'json') {
      content = generateJSON(profile);
      mimeType = 'application/json';
      filename = 'cv-export.json';
    } else if (format === 'markdown') {
      content = generateMarkdown(profile);
      mimeType = 'text/markdown';
      filename = 'cv-export.md';
    } else if (format === 'csv') {
      content = generateCSV(profile, type);
      mimeType = 'text/csv';
      filename = `cv-export-${type}.csv`;
    }

    return json(res, 200, {
      content,
      mimeType,
      filename
    });
  } catch (err) {
    return json(res, 400, { error: err.message || 'Request failed' });
  }
};
