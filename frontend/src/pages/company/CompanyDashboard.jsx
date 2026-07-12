import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

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

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export default function CompanyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/company");
        setStats(res.data);
      } catch (err) {
        setError("Failed to load company dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { key: "total_opportunities", label: "Opportunities", icon: "work", bg: "bg-primary-fixed", text: "text-primary", to: "/company/opportunities" },
    { key: "total", label: "Total Applications", icon: "groups", bg: "bg-tertiary-fixed", text: "text-tertiary", to: "/company/applicants" },
    { key: "shortlisted", label: "Shortlisted Students", icon: "verified_user", bg: "bg-secondary-container", text: "text-on-secondary-container", to: "/company/applicants" },
  ];

  return (
    <div className="p-8 space-y-6 max-w-[1440px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl border border-outline-variant shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">
            Welcome, <span className="text-primary">{user?.name || "Recruiter"}</span> 👋
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">Manage postings and screen candidate applications.</p>
        </div>
        <div>
          <button
            onClick={() => navigate("/company/applicants")}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">groups</span>
            Review Candidates
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm border border-error-container/20">{error}</div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-outline-variant p-6 h-32 flex flex-col gap-4">
              <div className="w-12 h-12 skeleton-loader shrink-0" />
              <div className="h-6 w-1/2 skeleton-loader mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((card) => (
            <Link key={card.key} to={card.to} className="glass-card p-6 rounded-2xl flex flex-col justify-between hover-lift transition-all duration-300 cursor-pointer">
              <div className="flex justify-between items-start">
                <div className={`p-3 ${card.bg} rounded-xl ${card.text}`}>
                  <span className="material-symbols-outlined font-variation-settings-'FILL'-1" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
                </div>
                <span className="text-xs text-on-surface-variant font-semibold">Live Metrics</span>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{card.label}</p>
                <h3 className="text-3xl font-extrabold text-on-surface mt-1">{stats ? stats[card.key] : 0}</h3>
              </div>
            </Link>
          ))}
        </div>
      )}
      {/* Analytics Charts Section */}
      {!loading && stats?.funnel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel Chart */}
          <div className="bg-white rounded-2xl border border-outline-variant p-6 shadow-sm hover-lift transition-all duration-300">
            <h3 className="text-base font-bold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">filter_alt</span>
              Hiring Funnel Conversions
            </h3>
            <div className="space-y-4">
              {[
                { label: "Applied / In Review", value: stats.funnel.applied, color: "bg-primary", percent: 100 },
                { label: "Assessment Stage", value: stats.funnel.assessment, color: "bg-amber-500", percent: stats.funnel.applied ? Math.round((stats.funnel.assessment / stats.funnel.applied) * 100) : 0 },
                { label: "Interview Stage", value: stats.funnel.interview, color: "bg-cyan-500", percent: stats.funnel.assessment ? Math.round((stats.funnel.interview / stats.funnel.assessment) * 100) : (stats.funnel.applied ? Math.round((stats.funnel.interview / stats.funnel.applied) * 100) : 0) },
                { label: "Shortlisted", value: stats.funnel.shortlisted, color: "bg-indigo-500", percent: stats.funnel.interview ? Math.round((stats.funnel.shortlisted / stats.funnel.interview) * 100) : (stats.funnel.applied ? Math.round((stats.funnel.shortlisted / stats.funnel.applied) * 100) : 0) },
                { label: "Selected / Offered", value: stats.funnel.selected, color: "bg-secondary", percent: stats.funnel.shortlisted ? Math.round((stats.funnel.selected / stats.funnel.shortlisted) * 100) : (stats.funnel.applied ? Math.round((stats.funnel.selected / stats.funnel.applied) * 100) : 0) },
              ].map((stage, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-on-surface-variant">{stage.label}</span>
                    <span className="text-on-surface font-bold">{stage.value} candidates <span className="text-[10px] text-on-surface-variant font-medium">({stage.percent}% conv.)</span></span>
                  </div>
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, Math.max(5, stage.percent))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Branch Distribution Chart */}
          <div className="bg-white rounded-2xl border border-outline-variant p-6 shadow-sm hover-lift transition-all duration-300">
            <h3 className="text-base font-bold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">bar_chart</span>
              Applicant Branch Distribution
            </h3>
            {Object.keys(stats.branches || {}).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-on-surface-variant opacity-60">
                <span className="material-symbols-outlined text-3xl mb-1">analytics</span>
                <p className="text-xs">No applicant branch data recorded</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(stats.branches || {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([branch, count], idx) => {
                    const totalApps = stats.total || 1;
                    const percent = Math.round((count / totalApps) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-on-surface-variant truncate max-w-xs">{branch}</span>
                          <span className="text-on-surface font-bold">{count} ({percent}%)</span>
                        </div>
                        <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className="h-full bg-secondary rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid of opportunities & recruiter instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {!loading && stats?.opportunities?.length > 0 ? (
            <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden hover-lift transition-all duration-300">
              <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/30">
                <h3 className="text-lg font-bold text-on-surface">Your Posted Opportunities</h3>
                <span className="text-xs font-bold text-primary bg-primary-container px-3 py-1 rounded-full uppercase">
                  {stats.open_opportunities} Active
                </span>
              </div>
              <div className="divide-y divide-outline-variant">
                {stats.opportunities.map((opp) => (
                  <div key={opp.id} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-surface-container-lowest transition-colors gap-4">
                    <div>
                      <h4 className="font-bold text-on-surface text-base">{opp.title}</h4>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-on-surface-variant font-medium">
                        {opp.location && <span>📍 {opp.location}</span>}
                        {opp.stipend && <span>💰 {opp.stipend}</span>}
                        {opp.duration && <span>⏱ {opp.duration}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        opp.status === "open" ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-500"
                      }`}>
                        {opp.status.toUpperCase()}
                      </span>
                      <button
                        onClick={() => navigate("/company/applicants", { state: { filterOppId: opp.id } })}
                        className="px-4 py-2 border border-outline-variant hover:border-primary text-on-surface hover:text-primary rounded-xl text-xs font-bold transition-all bg-white"
                      >
                        View Applicants
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !loading && (
              <div className="bg-white rounded-2xl border border-outline-variant p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30 block mb-2">work</span>
                <h4 className="font-bold text-on-surface text-sm">No opportunities listed yet</h4>
                <p className="text-xs text-on-surface-variant mt-1">Please coordinate with the Training & Placement Officer (TPO) to list new internship drives.</p>
              </div>
            )
          )}
        </div>

        {/* Right 1 Column */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <div className="bg-white rounded-2xl border border-outline-variant p-6 shadow-sm hover-lift transition-all duration-300">
            <h4 className="font-bold text-on-surface text-base mb-4">Quick Shortcuts</h4>
            <div className="space-y-3">
              <Link
                to="/company/applicants"
                className="flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container rounded-xl transition-all group"
              >
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">groups</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">Screen Applications</p>
                  <p className="text-[10px] text-on-surface-variant">Review resumes and shortlist candidates</p>
                </div>
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container rounded-xl transition-all group"
              >
                <div className="w-10 h-10 bg-secondary-container text-on-secondary-container rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">settings</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">Recruiter Settings</p>
                  <p className="text-[10px] text-on-surface-variant">Change login email or update password</p>
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 shadow-sm hover-lift transition-all duration-300">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-2xl shrink-0">info</span>
              <div>
                <h4 className="font-bold text-on-surface text-sm">Placement Office Support</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  Need to post a new job drive, extend a deadline, or request specialized CGPA eligibility criteria?
                </p>
                <p className="text-xs text-primary font-bold mt-3">Contact Admin: placement@college.edu</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications Activity (Rich additions) */}
      {!loading && stats?.recent_applications?.length > 0 && (
        <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden hover-lift transition-all duration-300">
          <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/30">
            <h3 className="text-lg font-bold text-on-surface">Recent Submissions for Your Drives</h3>
            <button onClick={() => navigate("/company/applicants")} className="text-xs font-bold text-primary hover:underline">
              View All Candidates →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/40">
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Opportunity</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Applied Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {stats.recent_applications.map((row, i) => {
                  const studentName = row.students?.profiles?.name || "Unknown";
                  const studentEmail = row.students?.profiles?.email || "";
                  return (
                    <tr key={i} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs shrink-0 border border-outline-variant">
                            {getInitials(studentName)}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-on-surface">{studentName}</span>
                            <span className="text-[11px] block text-on-surface-variant">{studentEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface font-semibold">{row.opportunities?.title}</td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {new Date(row.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 border text-xs font-bold rounded-full ${statusStyles[row.status] || "bg-surface-variant text-on-surface-variant"}`}>
                          {row.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}