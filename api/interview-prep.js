const { json, requireAuth } = require('./_lib/auth');

const INTERVIEW_QUESTIONS = [
  { id: 'q1', category: 'behavioral', question: 'Tell me about a time you overcame a challenging technical problem.', tips: ['Use STAR method (Situation, Task, Action, Result)', 'Focus on your problem-solving approach', 'Highlight teamwork if relevant'] },
  { id: 'q2', category: 'behavioral', question: 'Describe a situation where you had to learn new technologies quickly.', tips: ['Show enthusiasm for learning', 'Explain your learning approach', 'Give concrete examples of what you learned'] },
  { id: 'q3', category: 'technical', question: 'How would you optimize a slow database query?', tips: ['Explain indexing strategies', 'Discuss query analysis tools', 'Mention caching approaches'] },
  { id: 'q4', category: 'technical', question: 'What is the difference between SQL and NoSQL databases?', tips: ['Discuss ACID vs BASE', 'Mention scalability differences', 'Give real-world use cases'] },
  { id: 'q5', category: 'situational', question: 'How would you handle a disagreement with a colleague?', tips: ['Stay professional and respectful', 'Focus on finding common ground', 'Show willingness to compromise'] },
  { id: 'q6', category: 'behavioral', question: 'Tell me about your biggest professional achievement.', tips: ['Quantify results when possible', 'Explain your role and impact', 'Show relevant skills used'] },
  { id: 'q7', category: 'technical', question: 'Explain REST API design principles.', tips: ['Discuss HTTP methods and status codes', 'Mention versioning strategies', 'Cover security considerations'] },
  { id: 'q8', category: 'situational', question: 'How do you handle tight deadlines?', tips: ['Prioritize effectively', 'Communicate proactively', 'Show examples of past successes'] }
];

const INTERVIEW_TIPS = [
  { id: 'tip1', category: 'preparation', title: 'Research the company thoroughly', content: 'Read recent news, understand their products, and learn about their company culture before the interview.' },
  { id: 'tip2', category: 'preparation', title: 'Prepare questions to ask', content: 'Ask thoughtful questions about the role, team, and company. This shows genuine interest.' },
  { id: 'tip3', category: 'communication', title: 'Practice the STAR method', content: 'Structure behavioral answers: Situation, Task, Action, Result. Provides clear narrative arc.' },
  { id: 'tip4', category: 'communication', title: 'Active listening', content: 'Listen carefully to questions. Take a moment to think before responding. Ask for clarification if needed.' },
  { id: 'tip5', category: 'technical', title: 'Think out loud', content: 'For technical questions, explain your thought process. Interviewers want to see your problem-solving approach.' },
  { id: 'tip6', category: 'communication', title: 'Tell stories with impact', content: 'Use specific examples with context. Include challenges, your actions, and measurable results.' },
  { id: 'tip7', category: 'technical', title: 'Clarify requirements first', content: 'Before solving problems, ask clarifying questions. Shows you understand scope and requirements.' },
  { id: 'tip8', category: 'mindset', title: 'Be authentic', content: 'Be genuine and honest. Employers want to hire real people, not rehearsed robots.' }
];

module.exports = async function handler(req, res) {
  try {
    const auth = requireAuth(req);
    if (!auth) return json(res, 401, { error: 'Unauthorized' });

    if (req.method === 'GET') {
      const type = (req.query && req.query.type) || 'all';
      
      if (type === 'questions') {
        return json(res, 200, { questions: INTERVIEW_QUESTIONS });
      }
      if (type === 'tips') {
        return json(res, 200, { tips: INTERVIEW_TIPS });
      }
      
      return json(res, 200, {
        questions: INTERVIEW_QUESTIONS,
        tips: INTERVIEW_TIPS,
        categories: ['behavioral', 'technical', 'situational']
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { action } = body;

      if (action === 'practice') {
        const { questionId, userAnswer } = body;
        const question = INTERVIEW_QUESTIONS.find(q => q.id === questionId);
        if (!question) return json(res, 404, { error: 'Question not found' });

        const feedback = {
          questionId,
          answered: !!userAnswer,
          tips: question.tips,
          lengthOk: userAnswer && userAnswer.length > 50,
          timestamp: new Date().toISOString()
        };

        return json(res, 200, { feedback });
      }

      if (action === 'get-random') {
        const category = body.category || null;
        const filtered = category
          ? INTERVIEW_QUESTIONS.filter(q => q.category === category)
          : INTERVIEW_QUESTIONS;
        const question = filtered[Math.floor(Math.random() * filtered.length)];
        return json(res, 200, { question });
      }

      return json(res, 400, { error: 'Unknown action' });
    }

    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    return json(res, 400, { error: err.message || 'Request failed' });
  }
};
