const { json, requireAuth } = require('./_lib/auth');
const { getDocuments, getDocumentFile } = require('./_lib/storage');

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const STOPWORDS = new Set(['the','and','a','to','of','in','for','with','on','at','is','are','as','an','by','from','that','this','it','be','or','we','you','your','our','i','my']);

function topKeywords(text, n = 20) {
  const tokens = tokenize(text).filter(t => !STOPWORDS.has(t) && t.length > 2);
  const freq = {};
  tokens.forEach(t => freq[t] = (freq[t]||0) + 1);
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,n).map(x=>x[0]);
}

function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  const inter = [...A].filter(x => B.has(x)).length;
  const uni = new Set([...A, ...B]).size;
  if (uni === 0) return 0;
  return inter / uni;
}

async function extractTextFromDoc(id) {
  const docs = await getDocuments();
  const doc = docs.find(d => d.id === id);
  if (!doc) return null;
  const buf = await getDocumentFile(id);
  if (!buf) return null;
  // simple text extraction for .txt
  if ((doc.filename||'').toLowerCase().endsWith('.txt') || (doc.mimeType||'').startsWith('text')) {
    return buf.toString('utf8');
  }
  // for other formats, return null (parsing not implemented server-side)
  return null;
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
    const jdText = body.jdText || '';
    let cvText = body.cvText || '';
    if (body.cvDocId) {
      const extracted = await extractTextFromDoc(body.cvDocId);
      if (extracted) cvText = extracted;
    }

    if (!jdText || !cvText) {
      // allow partial but warn
    }

    const jdKeywords = topKeywords(jdText, 50);
    const cvKeywords = topKeywords(cvText, 100);

    const match = jaccard(jdKeywords, cvKeywords);
    const missing = jdKeywords.filter(k => !cvKeywords.includes(k));
    const suggested = missing.slice(0, 10);

    const score = Math.round(match * 100);

    return json(res, 200, { score, missingKeywords: missing, suggestedSkills: suggested, jdKeywords, cvKeywords });
  } catch (err) {
    return json(res, 400, { error: err.message || 'Request failed' });
  }
};
