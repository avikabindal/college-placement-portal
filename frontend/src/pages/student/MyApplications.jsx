import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const statusStyles = {
  applied:             { badge: "bg-blue-50 text-blue-700 border border-blue-200",             label: "Applied" },
  under_review:        { badge: "bg-amber-50 text-amber-800 border border-amber-200",          label: "In Review" },
  shared_with_company: { badge: "bg-purple-50 text-purple-700 border border-purple-200",       label: "Shared with Company" },
  shortlisted:         { badge: "bg-indigo-50 text-indigo-700 border border-indigo-200",       label: "Shortlisted" },
  assessment:          { badge: "bg-orange-50 text-on-tertiary-fixed-variant border border-orange-200", label: "Assessment" },
  interview:           { badge: "bg-cyan-50 text-cyan-700 border border-cyan-200",             label: "Interview" },
  selected:            { badge: "bg-green-50 text-green-800 border border-green-200",          label: "Selected" },
  rejected:            { badge: "bg-red-50 text-red-800 border border-red-200",                label: "Rejected" },
};

const timelineSteps = [
  { key: "applied",             label: "Application Submitted", icon: "send" },
  { key: "under_review",        label: "Under Review",          icon: "manage_search" },
  { key: "shared_with_company", label: "Shared with Company",   icon: "share" },
  { key: "shortlisted",         label: "Shortlisted",           icon: "radio_button_checked" },
  { key: "assessment",          label: "Assessment Stage",      icon: "assignment" },
  { key: "interview",           label: "Interview Stage",        icon: "groups" },
  { key: "selected",            label: "Offer Extended",        icon: "workspace_premium" },
];

const statusOrder = ["applied", "under_review", "shared_with_company", "shortlisted", "assessment", "interview", "selected"];

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

export default function MyApplications() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_applications: 0, applied: 0, under_review: 0,
    shortlisted: 0, selected: 0, rejected: 0,
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  useEffect(() => {
    if (!user?.id) return;
    const fetchData = async () => {
      try {
        const [dashRes, appsRes] = await Promise.all([
          api.get("/dashboard/student"),
          api.get(`/applications/student/${user.id}`),
        ]);
        setStats(dashRes.data);
        setApplications(appsRes.data || []);
      } catch (err) {
        console.error("Failed to fetch applications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const activeCount = applications.filter(a =>
    ["applied", "under_review", "shared_with_company", "shortlisted", "assessment", "interview"].includes(a.status)
  ).length;
  const closedCount = applications.filter(a =>
    ["selected", "rejected"].includes(a.status)
  ).length;

  const filtered = applications.filter((app) => {
    if (filter === "active") return ["applied", "under_review", "shared_with_company", "shortlisted", "assessment", "interview"].includes(app.status);
    if (filter === "closed") return ["selected", "rejected"].includes(app.status);
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const shortlistRate = stats.total_applications > 0
    ? Math.round(((stats.shortlisted + stats.selected) / stats.total_applications) * 100)
    : 0;

  const handleWithdraw = async (appId) => {
    if (!window.confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) return;
    try {
      await api.delete(`/applications/${appId}`);
      setApplications(applications.filter(a => a.id !== appId));
      setExpandedId(null);
      // Refresh stats
      const dashRes = await api.get("/dashboard/student");
      setStats(dashRes.data);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to withdraw application.");
    }
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);
  const getCurrentStep = (status) => statusOrder.indexOf(status);

  return (
    <main className="flex-1 p-8 max-w-[1440px] mx-auto w-full space-y-6">
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">My Applications</h2>
          <p className="text-on-surface-variant text-sm mt-1">Track and manage your internship and job applications in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface-container border border-outline-variant rounded-xl p-1">
            {[
              { key: "all",    label: `All (${applications.length})` },
              { key: "active", label: `Active (${activeCount})` },
              { key: "closed", label: `Closed (${closedCount})` },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setPage(1); }}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filter === f.key
                    ? "bg-surface-container-lowest shadow-sm text-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[
          { icon: "trending_up", color: "text-primary bg-primary-fixed",          value: `${shortlistRate}%`, label: "Shortlist Rate" },
          { icon: "groups",      color: "text-purple-600 bg-purple-50",            value: applications.filter(a => a.status === "interview").length, label: "In Interview Stage" },
          { icon: "verified",    color: "text-secondary bg-secondary-container",   value: stats.selected || 0, label: "Offers Received" },
        ].map(({ icon, color, value, label }) => (
          <div key={label} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex items-center gap-4 hover-lift transition-all duration-300">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
              <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div>
              {loading ? (
                <div className="h-7 w-12 skeleton-loader rounded mb-1" />
              ) : (
                <p className="text-2xl font-bold text-on-surface">{value}</p>
              )}
              <p className="text-sm text-on-surface-variant">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant">
                {["Company", "Role", "Applied Date", "Status", ""].map((h, i) => (
                  <th key={i} className={`px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider ${i === 4 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-6">
                      <div className="h-6 skeleton-loader w-full" />
                    </td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">receipt_long</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">No Applications Yet</p>
                        <p className="text-xs text-on-surface-variant mt-1">You haven't submitted any internship or job drive applications yet.</p>
                      </div>
                      <div className="flex justify-center pt-2">
                        <Link to="/student/opportunities" className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-all cursor-pointer">
                          Browse Opportunities
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.flatMap((app) => {
                  const style = statusStyles[app.status] || statusStyles.applied;
                  const companyName = app.opportunities?.companies?.profiles?.name || "—";
                  const role = app.opportunities?.title || "—";
                  const isExpanded = expandedId === app.id;
                  const currentStep = getCurrentStep(app.status);
                  const borderColor =
                    app.status === "rejected"            ? "border-error" :
                    app.status === "selected"            ? "border-secondary" :
                    app.status === "shortlisted"         ? "border-primary" :
                    app.status === "interview"           ? "border-cyan-500" :
                    app.status === "assessment"          ? "border-orange-500" :
                    app.status === "shared_with_company" ? "border-purple-500" :
                    "border-outline-variant";

                  return [
                    <tr
                      key={app.id}
                      onClick={() => toggleExpand(app.id)}
                      className="group hover:bg-surface-container-low/20 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm shrink-0 border border-outline-variant">
                            {getInitials(companyName)}
                          </div>
                          <span className="font-semibold text-on-surface text-sm">{companyName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface font-medium">{role}</td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{formatDate(app.created_at)}</td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-0.5 border text-xs font-bold rounded-full ${style.badge}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span
                          className="material-symbols-outlined text-on-surface-variant group-hover:text-primary inline-block transition-transform duration-300 cursor-pointer"
                          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                        >
                          expand_more
                        </span>
                      </td>
                    </tr>,

                    isExpanded && (
                      <tr key={`${app.id}-detail`} className={`bg-surface-container-lowest border-l-4 ${borderColor}`}>
                        <td colSpan={5} className="px-8 py-8">
                          {app.status === "rejected" ? (
                            <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl border border-red-100 max-w-xl mb-6">
                              <span className="material-symbols-outlined text-error text-3xl">cancel</span>
                              <div>
                                <p className="font-bold text-error">Application Not Successful</p>
                                <p className="text-sm text-on-surface-variant mt-1">
                                  Unfortunately, your application to <strong>{companyName}</strong> was not shortlisted this time. Keep applying — the right opportunity is out there!
                                </p>
                                {app.remarks && (
                                  <p className="text-sm text-on-surface-variant mt-2 italic">
                                    Remarks: "{app.remarks}"
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : app.status === "selected" ? (
                            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-100 max-w-xl mb-6">
                              <span className="material-symbols-outlined text-secondary text-3xl">workspace_premium</span>
                              <div>
                                <p className="font-bold text-secondary">Congratulations! You've been selected!</p>
                                <p className="text-sm text-on-surface-variant mt-1">
                                  You have been selected for the <strong>{role}</strong> position at <strong>{companyName}</strong>. The TPO will be in touch with further details.
                                </p>
                                {app.remarks && (
                                  <p className="text-sm text-secondary mt-2 font-medium">
                                    "{app.remarks}"
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : null}

                          <div className="max-w-2xl">
                            {/* Resume & Cover note panel */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                              {app.resume_url && (
                                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant">
                                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Resume Link Submitted</p>
                                  <a
                                    href={app.resume_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-primary hover:underline font-bold text-xs"
                                  >
                                    <span className="material-symbols-outlined text-sm font-variation-settings-'FILL'-1">visibility</span>
                                    Open Submitted CV
                                  </a>
                                </div>
                              )}
                              {app.cover_note && (
                                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant">
                                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Your Cover Note</p>
                                  <p className="text-xs text-on-surface font-medium leading-relaxed">{app.cover_note}</p>
                                </div>
                              )}
                            </div>

                            {app.status !== "rejected" && app.status !== "selected" && (
                              <>
                                <h4 className="text-xs font-bold text-on-surface-variant mb-6 uppercase tracking-wider">Application Timeline</h4>

                                <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant">
                                  {timelineSteps.map((step, i) => {
                                    const done   = i < currentStep;
                                    const active = i === currentStep;
                                    const future = i > currentStep;
                                    return (
                                      <div key={step.key} className={`relative ${future ? "opacity-40" : ""}`}>
                                        <div className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                                          done   ? "bg-secondary text-white" :
                                          active ? "bg-primary text-white shadow-[0_0_8px_rgba(33,81,218,0.4)]" :
                                          "bg-outline-variant text-white"
                                        }`}>
                                          <span className={`material-symbols-outlined text-xs ${active ? "animate-pulse" : ""}`}>
                                            {done ? "check" : step.icon}
                                          </span>
                                        </div>
                                        <div>
                                          <p className={`text-xs font-bold ${active ? "text-primary" : "text-on-surface"}`}>
                                            {step.label}
                                          </p>
                                          {active && app.remarks && (
                                            <p className="text-[11px] text-on-surface-variant mt-1 bg-surface-container p-2 rounded-lg border border-outline-variant/30 italic">
                                              📢 Message: "{app.remarks}"
                                            </p>
                                          )}
                                          {active && !future && (
                                            <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium">
                                              {formatDate(app.updated_at)} · Current stage
                                            </p>
                                          )}
                                          {done && (
                                            <p className="text-[10px] text-on-surface-variant mt-0.5">Completed</p>
                                          )}
                                          {future && (
                                            <p className="text-[10px] text-on-surface-variant mt-0.5">Pending</p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            )}

                            {/* Withdraw Button */}
                            {app.status !== "rejected" && app.status !== "selected" && (
                              <div className="mt-8 pt-6 border-t border-outline-variant flex justify-end">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWithdraw(app.id);
                                  }}
                                  className="px-4 py-2 border border-error/30 text-error rounded-xl text-xs font-bold hover:bg-error-container/10 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm">cancel</span>
                                  Withdraw Application
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  ].filter(Boolean);
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > PER_PAGE && (
          <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between">
            <p className="text-sm text-on-surface-variant">
              Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} applications
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                    page === i + 1 ? "bg-primary text-white" : "hover:bg-surface-container text-on-surface-variant"
                  }`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}