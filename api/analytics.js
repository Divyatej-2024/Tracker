const { json, requireAuth } = require('./_lib/auth');
const { getLogs, getApplications } = require('./_lib/storage');

async function computeAnalytics() {
  const logs = await getLogs();
  const applications = await getApplications();

  const totalIncome = logs.reduce((sum, log) => sum + (log.applications || 0), 0);
  const totalApplied = applications.filter(a => a.status !== 'Saved').length;
  const successRate = totalApplied > 0 ? Math.round((applications.filter(a => a.status === 'Offer').length / totalApplied) * 100) : 0;
  
  const avgApplicationsPerDay = logs.length > 0 ? Math.round(totalIncome / logs.length * 10) / 10 : 0;
  const avgRecruitersPerDay = logs.length > 0 ? Math.round(logs.reduce((sum, log) => sum + (log.recruiters || 0), 0) / logs.length * 10) / 10 : 0;

  const statusBreakdown = {};
  ['Saved', 'Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn'].forEach(status => {
    statusBreakdown[status] = applications.filter(a => a.status === status).length;
  });

  const recentWeek = logs.filter(log => {
    const logDate = new Date(log.date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return logDate >= sevenDaysAgo;
  });

  const weeklyTrend = recentWeek.length > 0
    ? Math.round(recentWeek.reduce((sum, log) => sum + (log.applications || 0), 0) / recentWeek.length * 10) / 10
    : 0;

  return {
    summary: {
      totalApplications: totalApplied,
      successRate,
      avgApplicationsPerDay,
      avgRecruitersPerDay,
      weeklyTrend
    },
    statusBreakdown,
    timeSeriesData: logs.slice(-30).map(log => ({
      date: log.date,
      applications: log.applications || 0,
      recruiters: log.recruiters || 0,
      projectHours: log.projectHours || 0
    }))
  };
}

module.exports = async function handler(req, res) {
  try {
    const auth = requireAuth(req);
    if (!auth) return json(res, 401, { error: 'Unauthorized' });

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return json(res, 405, { error: 'Method not allowed' });
    }

    const analytics = await computeAnalytics();
    return json(res, 200, analytics);
  } catch (err) {
    return json(res, 400, { error: err.message || 'Request failed' });
  }
};
