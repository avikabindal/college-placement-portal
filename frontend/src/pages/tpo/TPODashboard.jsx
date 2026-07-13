import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";

const statusStyles = {
  applied:             "bg-blue-50 text-blue-700 border-blue-200",
  under_review:        "bg-amber-50 text-amber-800 border-amber-200",
  shared_with_company: "bg-purple-50 text-purple-700 border-purple-200",
  shortlisted:         "bg-indigo-50 text-indigo-700 border-indigo-200",
  assessment:          "bg-orange-50 text-on-tertiary-fixed-variant border-orange-200",
  interview:           "bg-cyan-50 text-cyan-700 border-cyan-200",
  selected:            "bg-green-50 text-green-800 border-green-200",
  rejected:            "bg-red-50 text-red-800 border-red-200",
};

const statusLabel = {
  applied: "APPLIED",
  under_review: "IN REVIEW",
  shared_with_company: "SHARED",
  shortlisted: "SHORTLISTED",
  assessment: "ASSESSMENT",
  interview: "INTERVIEW",
  selected: "SELECTED",
  rejected: "REJECTED",
};

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

export default function TPODashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    opportunities: 0, applications: 0, selected: 0, companies: 0,
    open_opportunities: 0, shortlisted: 0, rejected: 0, total_students: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [branchAnalytics, setBranchAnalytics] = useState({});
  const [stipendAnalytics, setStipendAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, appsRes] = await Promise.all([
          api.get("/dashboard/tpo"),
          api.get("/applications"),
        ]);
        
        const d = dashRes.data;
        setBranchAnalytics(d.branch_analytics || {});
        setStipendAnalytics(d.stipend_analytics || []);
        setStats({
          opportunities: d.total_opportunities || 0,
          applications: d.total_applications || 0,
          selected: d.selected || 0,
          companies: d.total_companies || 0,
          open_opportunities: d.open_opportunities || 0,
          shortlisted: d.shortlisted || 0,
          rejected: d.rejected || 0,
          total_students: d.total_students || 0,
        });

        const apps = appsRes.data || [];
        
        // 1. Process recent activity
        const recent = apps.slice(0, 5).map((app) => ({
          name: app.students?.profiles?.name || "Unknown Student",
          company: app.opportunities?.companies?.profiles?.name || "—",
          role: app.opportunities?.title || "—",
          status: app.status,
        }));
        setRecentActivity(recent);

        // 2. Compute company-wise application and placement stats
        const companyCounts = {};
        apps.forEach(app => {
          const compName = app.opportunities?.companies?.profiles?.name || "Unknown Recruiter";
          if (!companyCounts[compName]) {
            companyCounts[compName] = { applied: 0, selected: 0 };
          }
          companyCounts[compName].applied += 1;
          if (app.status === "selected") {
            companyCounts[compName].selected += 1;
          }
        });

        const chartData = Object.keys(companyCounts).map(comp => ({
          company: comp,
          applied: companyCounts[comp].applied,
          selected: companyCounts[comp].selected,
        })).sort((a, b) => b.applied - a.applied).slice(0, 5); // top 5 companies

        setCompanyData(chartData);

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const statCards = [
    { key: "opportunities", label: "Job Postings", icon: "work", bg: "bg-primary-fixed", text: "text-primary", sub: `${stats.open_opportunities} open`, to: "/tpo/opportunities" },
    { key: "applications", label: "Total Applications", icon: "description", bg: "bg-tertiary-fixed", text: "text-tertiary", sub: `${stats.shortlisted} shortlisted`, to: "/tpo/applications" },
    { key: "selected", label: "Students Selected", icon: "verified_user", bg: "bg-secondary-container", text: "text-on-secondary-container", sub: `${stats.rejected} rejected`, to: "/tpo/applications" },
    { key: "companies", label: "Partner Recruiters", icon: "domain", bg: "bg-primary-fixed-dim", text: "text-on-primary-fixed", sub: `${stats.total_students} students`, to: "/tpo/companies" },
  ];

  // Find max value in company stats for bar scaling
  const maxApplied = companyData.length > 0 ? Math.max(...companyData.map(c => c.applied)) : 1;

  // Placements ring calculations
  const placementRate = stats.total_students > 0 ? Math.round((stats.selected / stats.total_students) * 100) : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (placementRate / 100) * circumference;

  return (
    <div className="p-8 space-y-6 max-w-[1440px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl border border-outline-variant shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Admin Overview</h2>
          <p className="text-on-surface-variant text-sm mt-1">Track college-wide recruitment drives, application pipelines, and placement ratios.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/tpo/opportunities", { state: { openForm: true } })}
            className="flex items-center gap-2 px-5 py-3 bg-secondary text-on-secondary rounded-xl font-bold hover:opacity-90 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">business_center</span>
            Post New Job
          </button>
          <button
            onClick={() => navigate("/tpo/companies", { state: { openForm: true } })}
            className="flex items-center gap-2 px-5 py-3 bg-primary-container text-on-primary-container rounded-xl font-bold hover:bg-primary-fixed transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_business</span>
            Add Company
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Link key={card.key} to={card.to} className="glass-card p-6 rounded-2xl flex flex-col justify-between hover-lift transition-all duration-300 cursor-pointer">
            <div className="flex justify-between items-start">
              <div className={`p-3 ${card.bg} rounded-xl ${card.text}`}>
                <span className="material-symbols-outlined font-variation-settings-'FILL'-1" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
              </div>
              <span className="text-xs text-on-surface-variant font-semibold">{card.sub}</span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{card.label}</p>
              {loading ? (
                <div className="h-8 w-16 skeleton-loader mt-1" />
              ) : (
                <h3 className="text-3xl font-extrabold text-on-surface mt-1">{stats[card.key]}</h3>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Row 1: Graph & Placement Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Company-wise Applications & Placements Graph */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-outline-variant p-6 shadow-sm flex flex-col justify-between hover-lift transition-all duration-300">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Application Statistics by Recruiter</h3>
            <p className="text-xs text-on-surface-variant mt-1">Comparison of total student submissions vs. final placements across partner companies.</p>
          </div>

          {loading ? (
            <div className="h-64 skeleton-loader mt-6"></div>
          ) : companyData.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">bar_chart</span>
              No company placement statistics available yet
            </div>
          ) : (
            <div className="mt-6 relative">
              {/* Background Coordinate Grid Lines */}
              <div className="absolute inset-0 flex justify-between pointer-events-none pl-36 pr-28 pb-12">
                <div className="border-r border-dashed border-outline-variant/30 h-full" />
                <div className="border-r border-dashed border-outline-variant/30 h-full" />
                <div className="border-r border-dashed border-outline-variant/30 h-full" />
                <div className="border-r border-dashed border-outline-variant/30 h-full" />
              </div>

              <div className="divide-y divide-outline-variant/40 relative z-10">
                {companyData.map((data, idx) => {
                  const appliedWidth = Math.max(3, Math.round((data.applied / maxApplied) * 100));
                  const selectedWidth = Math.max(3, Math.round((data.selected / maxApplied) * 100));
                  
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2.5 first:pt-0 last:pb-0">
                      <div className="w-32 text-xs font-extrabold text-on-surface truncate" title={data.company}>
                        {data.company}
                      </div>
                      <div className="flex-1 space-y-2">
                        {/* Submissions Bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-surface-container-high h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/75 rounded-full transition-all duration-500 hover:bg-primary shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]"
                              style={{ width: `${appliedWidth}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-on-surface-variant w-24 shrink-0 text-left">
                            {data.applied} submission{data.applied !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {/* Placed Bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-surface-container-high h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary rounded-full transition-all duration-500 hover:opacity-95 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]"
                              style={{ width: `${selectedWidth}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-secondary w-24 shrink-0 text-left">
                            {data.selected} placed
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-5 mt-4 flex items-center gap-6 justify-center text-xs font-bold text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-primary/75 rounded" />
                    <span>Submissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-secondary rounded" />
                    <span>Hired</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Placements Rate Progress Ring */}
        <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between hover-lift transition-all duration-300">
          <div>
            <h4 className="font-bold text-on-surface text-base">College Placement Rate</h4>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {placementRate >= 70
                ? "🔥 Excellent recruitment season statistics!"
                : "Monitor partner postings to boost conversions."}
            </p>
          </div>

          <div className="py-6 flex justify-center">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-surface-container-highest"
                />
                <circle
                  cx="50" cy="50" r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  className="text-secondary transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-secondary">{placementRate}%</span>
                <span className="text-xs text-on-surface-variant">placed</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-outline-variant">
            {[
              { label: "Total Students", value: stats.total_students, color: "text-primary" },
              { label: "Offers Issued", value: stats.selected, color: "text-secondary" },
              { label: "Active Partners", value: stats.companies, color: "text-on-surface" },
            ].map((row, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">{row.label}</span>
                <span className={`font-bold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Branch & Salary Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branch-wise placement ratio */}
        <div className="bg-white rounded-2xl border border-outline-variant p-6 shadow-sm flex flex-col justify-between hover-lift transition-all duration-300">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Branch Placement Statistics</h3>
            <p className="text-xs text-on-surface-variant mt-1">Hires vs Total Applicants grouped by student branches.</p>
          </div>
          {Object.keys(branchAnalytics).length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant text-sm">No branch analytics data available.</div>
          ) : (
            <div className="mt-6 space-y-4">
              {Object.entries(branchAnalytics).map(([branch, item]) => {
                const maxVal = Math.max(...Object.values(branchAnalytics).map(b => b.applied), 1);
                const appliedPct = Math.round((item.applied / maxVal) * 100);
                const placedPct = Math.round((item.placed / maxVal) * 100);
                return (
                  <div key={branch} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-on-surface">
                      <span>{branch}</span>
                      <span className="text-[10px] text-on-surface-variant font-semibold">
                        {item.placed} hired / {item.applied} applied
                      </span>
                    </div>
                    <div className="relative w-full h-3 bg-surface-container rounded-full overflow-hidden flex">
                      <div className="absolute left-0 top-0 h-full bg-primary/20 rounded-full" style={{ width: `${appliedPct}%` }} />
                      <div className="absolute left-0 top-0 h-full bg-secondary rounded-full" style={{ width: `${placedPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Salary Trends */}
        <div className="bg-white rounded-2xl border border-outline-variant p-6 shadow-sm flex flex-col justify-between hover-lift transition-all duration-300">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Stipend & Salary Trends</h3>
            <p className="text-xs text-on-surface-variant mt-1">Stipend and packages offered across active job postings.</p>
          </div>
          {stipendAnalytics.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant text-sm">No stipend trends data available.</div>
          ) : (
            <div className="mt-6 space-y-4">
              {stipendAnalytics.map((opp, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 border-b border-outline-variant/30 last:border-b-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-on-surface">{opp.title}</span>
                  </div>
                  <span className="text-xs font-extrabold text-secondary bg-secondary-container px-2.5 py-1 rounded-lg">
                    {opp.stipend}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Submissions & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Recent Applications Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col justify-between hover-lift transition-all duration-300">
          <div>
            <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/30">
              <h3 className="text-lg font-bold text-on-surface">Recent Student Submissions</h3>
              <button onClick={() => navigate("/tpo/applications")} className="text-xs font-bold text-primary hover:underline">
                View All Pipeline →
              </button>
            </div>
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/40 sticky top-0 z-10 border-b border-outline-variant">
                    <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Recruiter</th>
                    <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Opportunity</th>
                    <th className="px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {recentActivity.map((row, i) => (
                    <tr key={i} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs shrink-0 border border-outline-variant">
                            {getInitials(row.name)}
                          </div>
                          <span className="text-sm font-semibold text-on-surface">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-2.5 text-sm text-on-surface font-medium">{row.company}</td>
                      <td className="px-6 py-2.5 text-sm text-on-surface-variant">{row.role}</td>
                      <td className="px-6 py-2.5">
                        <span className={`px-2.5 py-0.5 border text-xs font-bold rounded-full ${statusStyles[row.status] || "bg-surface-variant text-on-surface-variant"}`}>
                          {statusLabel[row.status] || row.status?.toUpperCase() || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="bg-white rounded-2xl border border-outline-variant p-6 shadow-sm space-y-4 hover-lift transition-all duration-300">
          <div>
            <h3 className="text-base font-bold text-on-surface">Quick Navigation</h3>
            <p className="text-xs text-on-surface-variant mt-1">Configure campus recruitment parameters.</p>
          </div>

          <div className="space-y-3.5">
            {[
              { to: "/tpo/opportunities", label: "Manage Drives", desc: "Post new placement templates", icon: "work", color: "text-primary bg-primary/10" },
              { to: "/tpo/applications", label: "Inspect Pipeline", desc: "View resumes & candidate details", icon: "description", color: "text-tertiary bg-tertiary-fixed-dim" },
              { to: "/tpo/companies", label: "Manage Partner Recruiters", desc: "Activate or deactivate accounts", icon: "domain", color: "text-secondary bg-secondary-container" },
              { to: "/tpo/profile?tab=audit", label: "Profile Audit Logs", desc: "Track changes made to TPO credentials", icon: "history", color: "text-red-500 bg-red-50" },
            ].map((link, idx) => (
              <Link
                key={idx}
                to={link.to}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low transition-colors group text-left"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${link.color}`}>
                  <span className="material-symbols-outlined text-base">{link.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">{link.label}</p>
                  <p className="text-[10px] text-on-surface-variant leading-none mt-0.5">{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}