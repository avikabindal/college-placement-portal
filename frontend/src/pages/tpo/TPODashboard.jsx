import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const statusStyles = {
  applied: "bg-surface-variant text-on-surface-variant",
  under_review: "bg-primary-container text-on-primary-container",
  shortlisted: "bg-tertiary-fixed text-tertiary",
  selected: "bg-secondary-container text-on-secondary-container",
  rejected: "bg-error-container text-on-error-container",
};

const statusLabel = {
  applied: "APPLIED",
  under_review: "IN REVIEW",
  shortlisted: "SHORTLISTED",
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, appsRes] = await Promise.all([
          api.get("/dashboard/tpo"),
          api.get("/applications"),
        ]);
        const d = dashRes.data;
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
        const recent = apps.slice(0, 5).map((app) => ({
          name: app.students?.profiles?.name || "Unknown Student",
          company: app.opportunities?.companies?.profiles?.name || "—",
          role: app.opportunities?.title || "—",
          status: app.status,
        }));
        setRecentActivity(recent);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const statCards = [
    { key: "opportunities", label: "Total Opportunities", icon: "work", bg: "bg-primary-fixed", text: "text-primary", sub: `${stats.open_opportunities} open` },
    { key: "applications", label: "Total Applications", icon: "description", bg: "bg-tertiary-fixed", text: "text-tertiary", sub: `${stats.shortlisted} shortlisted` },
    { key: "selected", label: "Students Selected", icon: "verified_user", bg: "bg-secondary-container", text: "text-on-secondary-container", sub: `${stats.rejected} rejected` },
    { key: "companies", label: "Companies Registered", icon: "domain", bg: "bg-primary-fixed-dim", text: "text-on-primary-fixed", sub: `${stats.total_students} students` },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-on-surface">Admin Overview</h2>
          <p className="text-on-surface-variant">Track placement metrics and manage recruitment pipelines.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/tpo/opportunities", { state: { openForm: true } })}
            className="flex items-center gap-2 px-5 py-3 bg-secondary text-on-secondary rounded-xl font-semibold shadow-sm hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-base">business_center</span>
            Post New Job
          </button>
          <button
            onClick={() => navigate("/tpo/companies", { state: { openForm: true } })}
            className="flex items-center gap-2 px-5 py-3 bg-primary-container text-on-primary-container rounded-xl font-semibold shadow-sm hover:bg-primary-fixed transition-all"
          >
            <span className="material-symbols-outlined text-base">add_business</span>
            Add Company
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.key} className="glass-card p-6 rounded-xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className={`p-3 ${card.bg} rounded-lg ${card.text}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">{card.sub}</span>
            </div>
            <div className="mt-4">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider">{card.label}</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1" />
              ) : (
                <h3 className="text-2xl font-bold text-on-surface">{stats[card.key]}</h3>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
            <h3 className="font-semibold text-on-surface text-lg">Recent Applications</h3>
            <button onClick={() => navigate("/tpo/applications")} className="text-sm text-primary hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />)}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="py-16 text-center text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">description</span>
                No applications yet
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-on-surface-variant bg-surface-container-low/30 uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Student Name</th>
                    <th className="px-6 py-4 font-semibold">Company</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {recentActivity.map((row, i) => (
                    <tr key={i} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {getInitials(row.name)}
                          </div>
                          <span className="text-sm font-medium">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{row.company}</td>
                      <td className="px-6 py-4 text-sm">{row.role}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${statusStyles[row.status] || "bg-surface-variant text-on-surface-variant"}`}>
                          {statusLabel[row.status] || row.status?.toUpperCase() || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-semibold text-on-surface text-lg mb-2">Application Breakdown</h3>
              <p className="text-sm text-on-surface-variant mb-4">Current status distribution across all applications.</p>
              <div className="space-y-3">
                {[
                  { label: "Selected", value: stats.selected, color: "bg-secondary" },
                  { label: "Shortlisted", value: stats.shortlisted, color: "bg-tertiary" },
                  { label: "Rejected", value: stats.rejected, color: "bg-error" },
                ].map(({ label, value, color }) => {
                  const pct = stats.applications > 0 ? Math.round((value / stats.applications) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                        <span>{label}</span>
                        <span>{value} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-6xl">analytics</span>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="font-semibold text-on-surface text-lg mb-4">Quick Stats</h3>
            <div className="space-y-4">
              {[
                { icon: "school", label: "Total Students", value: stats.total_students, color: "text-primary" },
                { icon: "work", label: "Open Opportunities", value: stats.open_opportunities, color: "text-tertiary" },
                { icon: "domain", label: "Active Companies", value: stats.companies, color: "text-secondary" },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                    <span className={`material-symbols-outlined text-base ${color}`}>{icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-on-surface-variant">{label}</p>
                    {loading ? (
                      <div className="h-5 w-12 bg-gray-200 animate-pulse rounded mt-0.5" />
                    ) : (
                      <p className="text-base font-bold text-on-surface">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/tpo/opportunities")}
              className="w-full mt-6 py-2 text-sm text-primary font-bold border border-primary/20 rounded-lg hover:bg-primary-container transition-colors"
            >
              Manage Opportunities
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}