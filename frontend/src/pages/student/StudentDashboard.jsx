import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const statusStyles = {
  applied:             "bg-primary-fixed text-on-primary-fixed border-primary/20",
  under_review:        "bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary/20",
  shared_with_company: "bg-surface-variant text-on-surface-variant border-outline/20",
  shortlisted:         "bg-primary-fixed-dim text-primary border-primary/20",
  assessment:          "bg-tertiary-fixed-dim text-on-tertiary-fixed-variant border-tertiary/20",
  interview:           "bg-surface-container-highest text-primary border-primary/20",
  selected:            "bg-secondary-container text-on-secondary-fixed-variant border-secondary/20",
  rejected:            "bg-error-container text-on-error-container border-error/20",
};

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard/student")
      .then((res) => setStats(res.data))
      .catch(() => setError("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const profileStrength = stats
    ? Math.min(100, Math.round(
        (stats.selected > 0 ? 20 : 0) +
        (stats.shortlisted > 0 ? 20 : 0) +
        (stats.total_applications > 5 ? 20 : (stats.total_applications || 0) * 4) +
        (stats.interview > 0 ? 20 : 0) +
        20
      ))
    : 0;
  const offset = circumference - (profileStrength / 100) * circumference;

  return (
    <div className="pl-6 pr-6 py-6 max-w-[1200px] space-y-6">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-on-surface">
            Welcome back, <span className="text-primary">{firstName}</span> 👋
          </h2>
          <p className="text-on-surface-variant mt-1">Here's what's happening with your placements today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {["G", "M", "A", "D"].map((l, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-xs font-bold">
                {l}
              </div>
            ))}
          </div>
          <span className="text-xs text-on-surface-variant">{stats?.total_applications ?? 0} companies applied to</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm">{error}</div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-outline-variant p-6 animate-pulse">
              <div className="h-12 w-12 bg-surface-container rounded-lg mb-4" />
              <div className="h-4 bg-surface-container rounded w-24 mb-2" />
              <div className="h-8 bg-surface-container rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Applied */}
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col gap-4 hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              </div>
              <span className="text-xs text-secondary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                Active
              </span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Total Applied</p>
              <h3 className="text-2xl font-bold text-on-surface mt-1">
                {String(stats?.total_applications ?? 0).padStart(2, "0")}
              </h3>
            </div>
          </div>

          {/* Under Review */}
          <div className="bg-tertiary-fixed p-6 rounded-xl border border-tertiary/20 shadow-[0px_4px_20px_rgba(98,60,0,0.1)] flex flex-col gap-4 hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
              </div>
              <span className="text-xs text-on-tertiary-fixed-variant font-semibold">In Progress</span>
            </div>
            <div>
              <p className="text-xs text-on-tertiary-fixed-variant/70 uppercase tracking-wider font-semibold">Under Review</p>
              <h3 className="text-2xl font-bold text-on-tertiary-fixed-variant mt-1">
                {String((stats?.under_review ?? 0) + (stats?.shared_with_company ?? 0)).padStart(2, "0")}
              </h3>
            </div>
          </div>

          {/* Interviews */}
          <div className="bg-secondary p-6 rounded-xl shadow-[0px_8px_24px_rgba(0,108,73,0.3)] flex flex-col gap-4 hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-on-secondary">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              </div>
              <span className="text-xs text-on-secondary/70 font-semibold">
                {(stats?.interview ?? 0) > 0 ? "Active" : "None yet"}
              </span>
            </div>
            <div>
              <p className="text-xs text-on-secondary/70 uppercase tracking-wider font-semibold">Interviews</p>
              <h3 className="text-2xl font-bold text-on-secondary mt-1">
                {String((stats?.interview ?? 0) + (stats?.assessment ?? 0)).padStart(2, "0")}
              </h3>
            </div>
          </div>

          {/* Offer Letters */}
          <div className="bg-primary p-6 rounded-xl shadow-[0px_8px_24px_rgba(0,55,176,0.3)] flex flex-col gap-4 hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-on-primary/70 uppercase tracking-wider font-semibold">Offer Letters</p>
              <h3 className="text-2xl font-bold text-on-primary mt-1">
                {String(stats?.selected ?? 0).padStart(2, "0")}
              </h3>
            </div>
            <div className="mt-auto">
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, ((stats?.selected ?? 0) / 3) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] mt-2 text-on-primary/70">Season Goal: 3 Offers</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Applications */}
      {!loading && stats?.recent?.length > 0 && (
        <div className="bg-white rounded-xl border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between">
            <h3 className="text-lg font-semibold text-on-surface">Recent Applications</h3>
            <Link
              to="/student/applications"
              className="px-4 py-2 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors font-semibold"
            >
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Applied</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {stats.recent.map((app, i) => {
                  const companyName = app.opportunities?.companies?.profiles?.name || "Unknown";
                  const style = statusStyles[app.status] || "bg-surface-container text-on-surface-variant border-outline/20";
                  return (
                    <tr key={i} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm">
                            {getInitials(companyName)}
                          </div>
                          <span className="font-medium text-on-surface text-sm">{companyName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">{app.opportunities?.title}</td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {app.created_at
                          ? new Date(app.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[12px] font-semibold border ${style}`}>
                          {app.status?.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              Showing {stats.recent.length} of {stats.total_applications ?? 0} applications
            </p>
            <Link to="/student/applications" className="text-xs font-semibold text-primary hover:underline">
              See all →
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Links */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/student/opportunities"
            className="bg-primary text-on-primary rounded-xl p-6 flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 shadow-[0px_8px_24px_rgba(0,55,176,0.25)]"
          >
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
            </div>
            <div>
              <h3 className="font-semibold text-base">Browse Opportunities</h3>
              <p className="text-sm mt-1 opacity-70">Find and apply for open positions</p>
            </div>
          </Link>

          <Link
            to="/student/applications"
            className="bg-secondary text-on-secondary rounded-xl p-6 flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 shadow-[0px_8px_24px_rgba(0,108,73,0.25)]"
          >
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            </div>
            <div>
              <h3 className="font-semibold text-base">My Applications</h3>
              <p className="text-sm mt-1 opacity-70">Track your application status</p>
            </div>
          </Link>

          <Link
            to="/student/profile"
            className="bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-xl p-6 flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 border border-tertiary/20"
          >
            <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center flex-shrink-0 text-tertiary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
            <div>
              <h3 className="font-semibold text-base">My Profile</h3>
              <p className="text-sm mt-1 opacity-70">Update your resume and skills</p>
            </div>
          </Link>

          <Link
            to="/settings"
            className="bg-surface-container-high text-on-surface rounded-xl p-6 flex items-start gap-4 hover:-translate-y-1 transition-all duration-300 border border-outline-variant"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
            </div>
            <div>
              <h3 className="font-semibold text-base">Settings</h3>
              <p className="text-sm mt-1 text-on-surface-variant">Manage your account</p>
            </div>
          </Link>
        </div>

        {/* Activity Ring */}
        <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div>
            <h4 className="text-lg font-semibold text-on-surface">Application Activity</h4>
            <p className="text-xs text-on-surface-variant mt-1">
              {profileStrength >= 80
                ? "Excellent — Top 10% of candidates"
                : profileStrength >= 50
                ? "Good — Keep applying!"
                : "Getting started — Explore more roles"}
            </p>
          </div>

          <div className="py-6 flex justify-center">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background track */}
                <circle
                  cx="50" cy="50" r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-surface-container-highest"
                />
                {/* Progress arc */}
                <circle
                  cx="50" cy="50" r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  className="text-primary transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-primary">{profileStrength}%</span>
                <span className="text-xs text-on-surface-variant">activity</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: "Total Applied", value: stats?.total_applications ?? "—", color: "text-primary", dot: "bg-primary" },
              { label: "Shortlisted", value: stats?.shortlisted ?? "—", color: "text-secondary", dot: "bg-secondary" },
              { label: "Selected", value: stats?.selected ?? "—", color: "text-tertiary", dot: "bg-tertiary" },
              { label: "Rejected", value: stats?.rejected ?? "—", color: "text-error", dot: "bg-error" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${row.dot}`} />
                  <span className="text-sm text-on-surface-variant">{row.label}</span>
                </div>
                <span className={`text-sm font-bold ${row.color}`}>{row.value}</span>
              </div>
            ))}

            <Link
              to="/student/opportunities"
              className="w-full mt-2 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-[0px_4px_12px_rgba(0,55,176,0.3)]"
            >
              <span className="material-symbols-outlined text-base">work</span>
              Browse Opportunities
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;