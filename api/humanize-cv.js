const { json, requireAuth } = require('./_lib/auth');
const { getDocuments, getDocumentFile } = require('./_lib/storage');

const PHRASE_MAP = {
  'utilize': 'use',
  'leverage': 'use',
  'in order to': 'to',
  'responsible for': 'managed',
  'worked closely with': 'collaborated with',
  'a large number of': 'many',
  'a wide range of': 'many',
  'best practices': 'practical techniques',
  'resulted in': 'led to',
  'during this period': 'during',
  'is able to': 'can',
  'in the event of': 'if',
  'due to the fact that': 'because',
  'highly motivated': 'motivated',
  'detail oriented': 'detailed',
  'team player': 'collaborative professional'
};

function normalizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

async function extractTextFromDoc(id) {
  const docs = await getDocuments();
  const doc = docs.find((d) => d.id === id);
  if (!doc) return null;
  const data = await getDocumentFile(id);
  if (!data) return null;
  if ((doc.filename || '').toLowerCase().endsWith('.txt') || (doc.mimeType || '').startsWith('text')) {
    return data.toString('utf8');
  }
  return null;
}

function humanizeText(original) {
  const cleaned = normalizeText(original);
  let rewritten = cleaned;
  Object.keys(PHRASE_MAP).forEach((key) => {
    const pattern = new RegExp(`\\b${key}\\b`, 'gi');
    rewritten = rewritten.replace(pattern, PHRASE_MAP[key]);
  });

  const genericPatterns = [
    /\bexcellent\b/gi,
    /\bpassionate\b/gi,
    /\boutstanding\b/gi,
    /\bproactive\b/gi,
    /\bhigh-performing\b/gi,
    /\bresults-driven\b/gi,
    /\bteam player\b/gi,
    /\bstrong communication\b/gi
  ];
  const suggestions = [];
  genericPatterns.forEach((pattern) => {
    if (pattern.test(rewritten)) {
      suggestions.push(rewritten.match(pattern)[0]);
      rewritten = rewritten.replace(pattern, '');
    }
  });

  return {
    before: cleaned,
    after: normalizeText(rewritten),
    suggestionTokens: suggestions
  };
}

function computeScore(before, after) {
  const issues = Object.keys(PHRASE_MAP).reduce((count, phrase) => {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    return count + ((before.match(regex) || []).length);
  }, 0);
  const score = Math.max(0, 100 - Math.min(80, issues * 12));
  return score;
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
    let cvText = normalizeText(body.cvText || '');
    if (body.cvDocId) {
      const extracted = extractTextFromDoc(body.cvDocId);
      if (extracted) cvText = normalizeText(extracted);
    }
    if (!cvText) return json(res, 400, { error: 'No CV text provided' });

    const result = humanizeText(cvText);
    const score = computeScore(result.before, result.after);
    const generic = Object.keys(PHRASE_MAP).filter((phrase) => new RegExp(`\\b${phrase}\\b`, 'gi').test(result.before));
    const humanizationScore = Math.max(0, Math.min(100, score + (result.suggestionTokens.length * 2)));

    return json(res, 200, {
      before: result.before,
      after: result.after,
      genericPhrases: generic,
      suggestions: result.suggestionTokens,
      score: humanizationScore
    });
  } catch (err) {
    return json(res, 400, { error: err.message || 'Request failed' });
  }
};
