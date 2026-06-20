const { json, requireAuth } = require('./_lib/auth');

const BUILT_IN_TEMPLATES = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, modern format for corporate roles',
    format: 'standard'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Design-focused with visual elements',
    format: 'modern'
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Research and publications emphasis',
    format: 'standard'
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Single-page concise format',
    format: 'minimal'
  },
  {
    id: 'detailed',
    name: 'Detailed',
    description: 'Comprehensive with all sections',
    format: 'expanded'
  }
];

function renderTemplate(profile, templateId) {
  const template = BUILT_IN_TEMPLATES.find(t => t.id === templateId) || BUILT_IN_TEMPLATES[0];
  
  const name = profile.name || 'Your Name';
  const email = profile.email || '';
  const phone = profile.phone || '';
  const summary = profile.summary || '';
  const skills = (profile.skills || []).map(s => `<li>${escapeHtml(s)}</li>`).join('');
  const experience = (profile.experience || []).map(exp => 
    `<div class="exp-item"><h4>${escapeHtml(exp.title)} — ${escapeHtml(exp.company)}</h4><div class="exp-period">${escapeHtml(exp.period)}</div><p>${escapeHtml(exp.summary)}</p></div>`
  ).join('');

  let html = '';
  
  if (template.format === 'minimal') {
    html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(name)} — CV</title><style>body{font-family:Arial;padding:20px;max-width:600px}h1{margin:0;font-size:1.8em}section{margin:16px 0}h2{font-size:1.2em;border-bottom:2px solid #333;padding-bottom:8px}ul{columns:2}</style></head><body><h1>${escapeHtml(name)}</h1><div>${escapeHtml(email)} | ${escapeHtml(phone)}</div><section><h2>Profile</h2><p>${escapeHtml(summary)}</p></section><section><h2>Skills</h2><ul>${skills}</ul></section><section><h2>Experience</h2>${experience}</section></body></html>`;
  } else if (template.format === 'expanded') {
    html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(name)} — CV</title><style>body{font-family:Georgia,serif;padding:40px;max-width:850px;line-height:1.6;color:#333}h1{font-size:2.2em;margin:0;color:#1a1a1a}h2{font-size:1.4em;margin:20px 0 10px;color:#2a2a2a;border-left:4px solid #0f766e;padding-left:10px}.contact{display:grid;grid-template-columns:auto auto auto;gap:20px;margin:16px 0;font-size:0.95em}.exp-item{margin:16px 0;page-break-inside:avoid}h4{margin:8px 0 4px}.exp-period{color:#666;font-style:italic;font-size:0.9em}</style></head><body><h1>${escapeHtml(name)}</h1><div class="contact"><span>${escapeHtml(email)}</span><span>${escapeHtml(phone)}</span></div><section><h2>Professional Summary</h2><p>${escapeHtml(summary)}</p></section><section><h2>Technical Skills</h2><ul>${skills}</ul></section><section><h2>Professional Experience</h2>${experience}</section></body></html>`;
  } else {
    html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(name)} — CV</title><style>body{font-family:Arial,Helvetica;padding:30px;max-width:750px;color:#111}h1{margin:0;font-size:2em}h2{margin:18px 0 12px;font-size:1.2em;color:#0f766e;border-bottom:1px solid #ddd;padding-bottom:6px}h4{margin:8px 0 4px;font-size:1em}section{margin:16px 0}.contact{display:flex;gap:16px;font-size:0.95em;margin:12px 0}.exp-item{margin-bottom:12px}ul{margin:8px 0;padding-left:20px}li{margin:4px 0}</style></head><body><h1>${escapeHtml(name)}</h1><div class="contact"><span>${escapeHtml(email)}</span><span>${escapeHtml(phone)}</span></div><section><h2>Profile</h2><p>${escapeHtml(summary)}</p></section><section><h2>Skills</h2><ul>${skills}</ul></section><section><h2>Experience</h2>${experience}</section></body></html>`;
  }
  
  return html;
}

function escapeHtml(text) {
  return String(text || '').replace(/[&"'<>]/g, m => ({'&':'&amp;','"':'&quot;',"'":"&#39;","<":"&lt;",">":"&gt;"})[m]);
}

module.exports = async function handler(req, res) {
  try {
    const auth = requireAuth(req);
    if (!auth) return json(res, 401, { error: 'Unauthorized' });

    if (req.method === 'GET') {
      return json(res, 200, { templates: BUILT_IN_TEMPLATES });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { profile, templateId } = body;
      
      if (!profile) return json(res, 400, { error: 'Profile required' });
      if (!templateId) return json(res, 400, { error: 'Template ID required' });

      const html = renderTemplate(profile, templateId);
      return json(res, 200, { html, templateId });
    }

    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    return json(res, 400, { error: err.message || 'Request failed' });
  }
};
