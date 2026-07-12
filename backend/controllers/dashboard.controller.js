const { supabaseAdmin } = require("../database/supabase");

const tpoDashboard = async (req, res) => {
  const [companies, opportunities, applications, students] = await Promise.all([
    supabaseAdmin.from("companies").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("opportunities").select("id, status, title, stipend"),
    supabaseAdmin.from("applications").select("id, status"),
    supabaseAdmin.from("students").select("id", { count: "exact", head: true }),
  ]);

  const oppData = opportunities.data || [];
  const appData = applications.data || [];

  // Group branch selection rates
  const branchStats = {};
  const { data: studentsList } = await supabaseAdmin.from("students").select("branch");
  (studentsList || []).forEach(s => {
    if (s.branch) {
      if (!branchStats[s.branch]) {
        branchStats[s.branch] = { applied: 0, placed: 0 };
      }
    }
  });

  const { data: appsList } = await supabaseAdmin
    .from("applications")
    .select("status, students(branch)");
  
  (appsList || []).forEach(app => {
    const branch = app.students?.branch;
    if (branch) {
      if (!branchStats[branch]) {
        branchStats[branch] = { applied: 0, placed: 0 };
      }
      branchStats[branch].applied += 1;
      if (app.status === "selected") {
        branchStats[branch].placed += 1;
      }
    }
  });

  // Extract stipend statistics
  const stipendStats = oppData
    .filter(o => o.stipend)
    .map(o => ({
      title: o.title,
      stipend: o.stipend,
    }))
    .slice(0, 10);

  res.json({
    total_companies: companies.count || 0,
    total_students: students.count || 0,
    total_opportunities: oppData.length,
    open_opportunities: oppData.filter(o => o.status === "open").length,
    total_applications: appData.length,
    shortlisted: appData.filter(a => a.status === "shortlisted").length,
    selected: appData.filter(a => a.status === "selected").length,
    rejected: appData.filter(a => a.status === "rejected").length,
    branch_analytics: branchStats,
    stipend_analytics: stipendStats,
  });
};

const studentDashboard = async (req, res) => {
  const { data: apps, error } = await supabaseAdmin
    .from("applications")
    .select("id, status, remarks, created_at, scheduled_date, event_details, opportunities(id, title, location, companies(profiles(name)))")
    .eq("student_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    total_applications: apps.length,
    applied: apps.filter(a => a.status === "applied").length,
    under_review: apps.filter(a => a.status === "under_review").length,
    shortlisted: apps.filter(a => a.status === "shortlisted").length,
    selected: apps.filter(a => a.status === "selected").length,
    rejected: apps.filter(a => a.status === "rejected").length,
    recent: apps.slice(0, 5),
    interviews: apps.filter(a => ["assessment", "interview"].includes(a.status)),
    alerts: apps.filter(a => a.remarks && a.status !== "rejected" && a.status !== "selected").slice(0, 3),
    calendar_events: apps.filter(a => a.scheduled_date).map(a => ({
      id: a.id,
      status: a.status,
      scheduled_date: a.scheduled_date,
      event_details: a.event_details,
      title: a.opportunities?.title,
      company: a.opportunities?.companies?.profiles?.name,
    })),
  });
};

const companyDashboard = async (req, res) => {
  const { data: opps, error: oppError } = await supabaseAdmin
    .from("opportunities")
    .select("id, title, status")
    .eq("company_id", req.user.id);

  if (oppError) return res.status(500).json({ error: oppError.message });

  const oppIds = opps.map(o => o.id);
  let appStats = { total: 0, shortlisted: 0, rejected: 0, funnel: { applied: 0, assessment: 0, interview: 0, shortlisted: 0, selected: 0 }, branches: {} };
  let recentApps = [];

  if (oppIds.length > 0) {
    const [statsRes, recentRes] = await Promise.all([
      supabaseAdmin.from("applications").select("status, students(branch)").in("opportunity_id", oppIds),
      supabaseAdmin
        .from("applications")
        .select("*, students(profiles(name, email)), opportunities(title)")
        .in("opportunity_id", oppIds)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (statsRes.data) {
      const apps = statsRes.data;
      
      const funnel = {
        applied: apps.filter(a => ["applied", "under_review", "shared_with_company"].includes(a.status)).length,
        assessment: apps.filter(a => a.status === "assessment").length,
        interview: apps.filter(a => a.status === "interview").length,
        shortlisted: apps.filter(a => a.status === "shortlisted").length,
        selected: apps.filter(a => a.status === "selected").length,
      };

      const branchCounts = {};
      apps.forEach(a => {
        const branchName = a.students?.branch || "Unknown";
        branchCounts[branchName] = (branchCounts[branchName] || 0) + 1;
      });

      appStats = {
        total: apps.length,
        shortlisted: apps.filter(a => a.status === "shortlisted").length,
        rejected: apps.filter(a => a.status === "rejected").length,
        funnel,
        branches: branchCounts,
      };
    }
    recentApps = recentRes.data || [];
  }

  res.json({
    total_opportunities: opps.length,
    open_opportunities: opps.filter(o => o.status === "open").length,
    ...appStats,
    opportunities: opps,
    recent_applications: recentApps,
  });
};

module.exports = { tpoDashboard, studentDashboard, companyDashboard };