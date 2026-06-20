const { json, requireAuth } = require('./_lib/auth');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const RECRUITERS_FILE = path.join(DATA_DIR, 'recruiters.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(RECRUITERS_FILE)) {
      fs.writeFileSync(RECRUITERS_FILE, '[]', 'utf8');
    }
  } catch (err) {
    // ignore
  }
}

function loadRecruitersFromFile() {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(RECRUITERS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.warn('Could not load recruiters from disk');
    return [];
  }
}

function persistRecruitersToFile(recruiters) {
  try {
    ensureDataDir();
    fs.writeFileSync(RECRUITERS_FILE, JSON.stringify(recruiters, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not persist recruiters to disk');
  }
}

module.exports = async function handler(req, res) {
  try {
    const auth = requireAuth(req);
    if (!auth) return json(res, 401, { error: 'Unauthorized' });

    if (req.method === 'GET') {
      const recruiters = loadRecruitersFromFile().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return json(res, 200, { recruiters });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { name, company, email, phone, notes, lastContact } = body;

      if (!name || !email) return json(res, 400, { error: 'Name and email required' });

      const recruiters = loadRecruitersFromFile();
      const now = new Date().toISOString();
      const recruiter = {
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        name: String(name).trim(),
        company: String(company || '').trim(),
        email: String(email).trim(),
        phone: String(phone || '').trim(),
        notes: String(notes || '').trim(),
        lastContact: lastContact || now,
        interactions: 0,
        createdAt: now
      };

      recruiters.push(recruiter);
      persistRecruitersToFile(recruiters);
      return json(res, 201, { recruiter });
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { id } = body;
      if (!id) return json(res, 400, { error: 'ID required' });

      const recruiters = loadRecruitersFromFile();
      const idx = recruiters.findIndex(r => r.id === id);
      if (idx === -1) return json(res, 404, { error: 'Not found' });

      const recruiter = recruiters[idx];
      const updates = Object.assign({}, recruiter);

      if (body.name) updates.name = String(body.name).trim();
      if (body.company !== undefined) updates.company = String(body.company).trim();
      if (body.email !== undefined) updates.email = String(body.email).trim();
      if (body.phone !== undefined) updates.phone = String(body.phone).trim();
      if (body.notes !== undefined) updates.notes = String(body.notes).trim();
      if (body.lastContact !== undefined) updates.lastContact = body.lastContact;
      if (body.interactions !== undefined) updates.interactions = Number(body.interactions);

      recruiters[idx] = updates;
      persistRecruitersToFile(recruiters);
      return json(res, 200, { recruiter: updates });
    }

    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = body.id || (req.query && req.query.id);
      if (!id) return json(res, 400, { error: 'ID required' });

      const recruiters = loadRecruitersFromFile();
      const filtered = recruiters.filter(r => r.id !== id);
      persistRecruitersToFile(filtered);
      return json(res, 200, { ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    return json(res, 400, { error: err.message || 'Request failed' });
  }
};
