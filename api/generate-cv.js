const { json, requireAuth } = require('./_lib/auth');

function simpleTemplate(profile, type) {
  const name = profile.name || 'Your Name';
  const email = profile.email || '';
  const phone = profile.phone || '';
  const summary = profile.summary || '';
  const skills = (profile.skills || []).map(s=>`<li>${escapeHtml(s)}</li>`).join('');
  const experience = (profile.experience || []).map(exp=>`<h4>${escapeHtml(exp.title)} — ${escapeHtml(exp.company)}</h4><div>${escapeHtml(exp.period)}</div><p>${escapeHtml(exp.summary)}</p>`).join('');

  const header = `<h1>${escapeHtml(name)}</h1><div>${escapeHtml(email)} • ${escapeHtml(phone)}</div>`;
  const body = `<section><h2>Profile</h2><p>${escapeHtml(summary)}</p></section><section><h2>Skills</h2><ul>${skills}</ul></section><section><h2>Experience</h2>${experience}</section>`;
  const layout = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(name)} — CV</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:24px;max-width:800px;color:#111}h1{margin:0}h2{margin-top:18px}</style></head><body>${header}${body}</body></html>`;
  return layout;
}

function escapeHtml(text) {
  return String(text || '').replace(/[&"'<>]/g, function (m) {
    return ({'&':'&amp;','"':'&quot;',"'":"&#39;","<":"&lt;",">":"&gt;"})[m];
  });
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
    const profile = body.profile || {};
    const type = body.type || 'Graduate';

    // Simple generator: produce HTML CV using provided profile data.
    const cvHtml = simpleTemplate(profile, type);
    return json(res, 200, { html: cvHtml });
  } catch (error) {
    return json(res, 400, { error: error.message || 'Request failed' });
  }
};
