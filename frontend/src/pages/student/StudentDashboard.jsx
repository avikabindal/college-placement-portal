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

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, profileRes, oppsRes] = await Promise.all([
          api.get("/dashboard/student"),
          api.get("/students/profile"),
          api.get("/opportunities"),
        ]);

        setStats(dashRes.data);
        setCalendarEvents(dashRes.data.calendar_events || []);
        setStudentProfile(profileRes.data);

        // Process recommendations based on skills overlap or branch
        const openOpps = oppsRes.data || [];
        const studentSkills = profileRes.data?.skills
          ? typeof profileRes.data.skills === "string"
            ? profileRes.data.skills.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
            : Array.isArray(profileRes.data.skills) ? profileRes.data.skills.map(s => s.toLowerCase()) : []
          : [];
        
        const studentBranch = profileRes.data?.branch?.toLowerCase() || "";

        const matched = openOpps
          .filter(opp => opp.status === "open")
          .map(opp => {
            let score = 0;
            // Skills matching
            const oppSkills = opp.skills_required
              ? opp.skills_required.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
              : [];
            
            const commonSkills = oppSkills.filter(s => studentSkills.includes(s));
            score += commonSkills.length * 10; // 10 points per matching skill

            // Branch matching
            const eligibleBranches = opp.eligible_branches
              ? opp.eligible_branches.split(",").map(b => b.trim().toLowerCase()).filter(Boolean)
              : [];
            
            if (eligibleBranches.some(b => studentBranch.includes(b) || b.includes(studentBranch))) {
              score += 15;
            }

            return { ...opp, matchScore: score, commonSkills };
          })
          .filter(opp => opp.matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 3);

        setRecommendations(matched);

        // Process deadlines closing soonest
        const soon = openOpps
          .filter(opp => opp.status === "open" && opp.apply_deadline && new Date(opp.apply_deadline) >= new Date())
          .sort((a, b) => new Date(a.apply_deadline) - new Date(b.apply_deadline))
          .slice(0, 3);
        setDeadlines(soon);

      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load student dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";

  // Compute profile checklist
  const checklist = [];
  if (studentProfile) {
    if (!studentProfile.resume_url) checklist.push({ label: "Upload Resume Link", route: "/student/profile", icon: "upload_file" });
    if (!studentProfile.skills) checklist.push({ label: "Add Technical Skills", route: "/student/profile", icon: "psychology" });
    if (!studentProfile.linkedin_url) checklist.push({ label: "Link LinkedIn Profile", route: "/student/profile", icon: "link" });
    if (!studentProfile.registration_year) checklist.push({ label: "Add Registration Year", route: "/student/profile", icon: "calendar_today" });
    if (!studentProfile.phone) checklist.push({ label: "Add Phone Number", route: "/student/profile", icon: "phone" });
  }

  const completionFields = ["name", "branch", "graduation_year", "cgpa", "phone", "resume_url", "linkedin_url", "registration_year"];
  const profileStrength = studentProfile
    ? Math.round(
        ((completionFields.filter((f) => studentProfile[f] || (f === "name" && user?.name)).length + (studentProfile.skills ? 1 : 0)) /
          (completionFields.length + 1)) * 100
      )
    : 0;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (profileStrength / 100) * circumference;

  return (
    <div className="pl-8 pr-8 py-6 max-w-[1440px] mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">
            Welcome back, <span className="text-primary">{firstName}</span> 👋
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">Here is a summary of your career pathway and application history.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Your CGPA</p>
            <p className="text-xl font-bold text-on-surface">{studentProfile?.cgpa ? parseFloat(studentProfile.cgpa).toFixed(2) : "—"}</p>
          </div>
          <div className="w-px h-8 bg-outline-variant" />
          <div className="text-right">
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Branch</p>
            <p className="text-sm font-bold text-primary">{studentProfile?.branch || "—"}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm border border-error-container/20">{error}</div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 h-32 flex flex-col gap-4">
              <div className="w-12 h-12 skeleton-loader shrink-0" />
              <div className="h-6 w-1/2 skeleton-loader mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Applications */}
          <Link to="/student/applications" className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between hover-lift transition-all duration-300 cursor-pointer">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                <span className="material-symbols-outlined font-variation-settings-'FILL'-1">send</span>
              </div>
              <span className="text-xs text-on-surface-variant font-semibold">Sent</span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Applied</p>
              <h3 className="text-3xl font-extrabold text-on-surface mt-1">{stats?.total_applications || 0}</h3>
            </div>
          </Link>

          {/* Under Review */}
          <Link to="/student/applications" className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between hover-lift transition-all duration-300 cursor-pointer">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-amber-50 text-amber-800 rounded-xl">
                <span className="material-symbols-outlined font-variation-settings-'FILL'-1">visibility</span>
              </div>
              <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">In Review</span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Under Review</p>
              <h3 className="text-3xl font-extrabold text-on-surface mt-1">{stats?.under_review || 0}</h3>
            </div>
          </Link>

          {/* Shortlisted */}
          <Link to="/student/applications" className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between hover-lift transition-all duration-300 cursor-pointer">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                <span className="material-symbols-outlined font-variation-settings-'FILL'-1">check_box</span>
              </div>
              <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">Next Stage</span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Shortlisted</p>
              <h3 className="text-3xl font-extrabold text-on-surface mt-1">{stats?.shortlisted || 0}</h3>
            </div>
          </Link>

          {/* Selected Offers */}
          <Link to="/student/applications" className="bg-secondary p-6 rounded-2xl text-on-secondary shadow-md flex flex-col justify-between hover-lift transition-all duration-300 relative overflow-hidden cursor-pointer">
            <div className="absolute -bottom-4 -right-4 text-white/5 font-extrabold text-8xl pointer-events-none">★</div>
            <div className="flex justify-between items-start relative z-10">
              <div className="p-3 bg-white/20 text-on-secondary rounded-xl">
                <span className="material-symbols-outlined font-variation-settings-'FILL'-1">workspace_premium</span>
              </div>
              <span className="text-xs text-on-secondary bg-white/10 px-2.5 py-0.5 rounded-full font-bold">Placed</span>
            </div>
            <div className="mt-4 relative z-10">
              <p className="text-xs font-semibold text-on-secondary/70 uppercase tracking-wider">Offers Received</p>
              <h3 className="text-3xl font-extrabold text-white mt-1">{stats?.selected || 0}</h3>
            </div>
          </Link>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upcoming Interviews & Assessments (Polished Alert Addition) */}
          {!loading && stats?.interviews?.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm space-y-4 hover-lift transition-all duration-300">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-600 font-variation-settings-'FILL'-1">event_upcoming</span>
                <h3 className="text-lg font-bold text-on-surface">Upcoming Assessments & Interviews</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.interviews.map((app) => (
                  <div key={app.id} className="border border-outline-variant rounded-xl p-4 bg-cyan-50/15 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
                    <div>
                      <span className="px-2.5 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-100 text-[9px] font-bold rounded-full uppercase tracking-wider">
                        {app.status}
                      </span>
                      <h4 className="font-bold text-on-surface text-sm mt-2.5">{app.opportunities?.title}</h4>
                      <p className="text-xs text-on-surface-variant font-semibold mt-0.5">
                        {app.opportunities?.companies?.profiles?.name}
                      </p>
                      {app.remarks && (
                        <p className="text-xs bg-surface-container-low/70 p-2.5 rounded-lg border border-outline-variant/35 text-on-surface-variant font-medium mt-3 italic leading-relaxed">
                          📢 Info: "{app.remarks}"
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-outline-variant/40 flex justify-between items-center text-[10px] text-on-surface-variant font-semibold">
                      <span>Assigned pipeline stage</span>
                      <Link to="/student/applications" className="text-primary hover:underline">Track Process →</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application Updates & Coordinator Alerts */}
          {!loading && stats?.alerts?.length > 0 && (
            <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-4 hover-lift transition-all duration-300">
              <div className="flex items-start gap-3">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-lg material-symbols-outlined font-variation-settings-'FILL'-1">notifications_active</span>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Application Updates & Coordinator Notes</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Action items or instructions from placement desks & recruiters.</p>
                </div>
              </div>
              <div className="space-y-3">
                {stats.alerts.map((app) => (
                  <div key={app.id} className="bg-surface-container-lowest p-4 rounded-xl border border-amber-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-on-surface">
                        {app.opportunities?.title} ({app.opportunities?.companies?.profiles?.name})
                      </p>
                      <p className="text-[10px] text-amber-800 font-bold mt-1 uppercase tracking-wider">
                        Stage: {app.status.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-on-surface-variant font-medium mt-2 bg-amber-50/20 p-2.5 rounded-lg border border-amber-100/50 italic leading-relaxed">
                        "{app.remarks}"
                      </p>
                    </div>
                    <Link
                      to="/student/applications"
                      className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/50 rounded-lg text-xs font-bold transition-all shrink-0 text-center"
                    >
                      View Timeline
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Opportunities */}
          {!loading && recommendations.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm hover-lift transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Recommended For You</h3>
                  <p className="text-xs text-on-surface-variant">Matched automatically based on your technical skills & eligibility.</p>
                </div>
                <Link to="/student/opportunities" className="text-sm font-semibold text-primary hover:underline">View All</Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map((opp) => (
                  <div key={opp.id} className="border border-outline-variant rounded-xl p-4 flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all bg-surface-bright group">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold rounded text-[10px]">
                          {opp.matchScore}% Match
                        </span>
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-lg">arrow_forward</span>
                      </div>
                      <h4 className="font-bold text-on-surface text-sm line-clamp-1 group-hover:text-primary transition-colors">{opp.title}</h4>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">{opp.companies?.profiles?.name}</p>
                      
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {opp.commonSkills?.slice(0, 2).map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-secondary-container/10 border border-secondary/20 text-secondary text-[9px] font-bold rounded-full uppercase">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-outline-variant flex justify-between items-center">
                      <span className="text-[11px] font-bold text-on-surface-variant">💰 {opp.stipend || "Unpaid"}</span>
                      <button
                        onClick={() => navigate(`/student/opportunities/${opp.id}`)}
                        className="text-xs font-bold text-primary group-hover:underline"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile Checklist (If incomplete) */}
          {!loading && checklist.length > 0 && (
            <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-6 shadow-sm hover-lift transition-all duration-300">
              <div className="flex items-start gap-3 mb-4">
                <span className="p-2 bg-amber-100 text-amber-800 rounded-lg material-symbols-outlined">warning</span>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Complete Your Placement Profile</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Recruiters filter profiles by scores, skills, and resume links. Don't miss out!</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {checklist.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(item.route)}
                    className="flex items-center gap-3 p-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-left hover:border-amber-400 hover:shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-amber-700 bg-amber-50 p-2 rounded-lg text-sm shrink-0">{item.icon}</span>
                    <span className="text-xs font-bold text-on-surface">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Applications */}
          {!loading && stats?.recent?.length > 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden hover-lift transition-all duration-300">
              <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/30">
                <h3 className="text-lg font-bold text-on-surface">Recent Applications</h3>
                <Link to="/student/applications" className="text-sm font-semibold text-primary hover:underline">View All</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low/40">
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
                              <div className="w-8 h-8 rounded bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs shrink-0 border border-outline-variant">
                                {getInitials(companyName)}
                              </div>
                              <span className="font-semibold text-on-surface text-sm">{companyName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-on-surface">{app.opportunities?.title}</td>
                          <td className="px-6 py-4 text-sm text-on-surface-variant">
                            {app.created_at
                              ? new Date(app.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                              : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 border text-xs font-bold rounded-full ${style}`}>
                              {app.status?.replace(/_/g, " ")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            !loading && (
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30 block mb-2">description</span>
                <h4 className="font-bold text-on-surface text-sm">No applications submitted yet</h4>
                <p className="text-xs text-on-surface-variant mt-1 mb-4">Search placement drives to send your first cover letter.</p>
                <Link to="/student/opportunities" className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-sm hover:opacity-90 inline-block">
                  Find Opportunities
                </Link>
              </div>
            )
          )}
        </div>

        {/* Right 1 Column - Dashboard Sidebar (Checklist, Deadlines, Shortcuts) */}
        <div className="space-y-6">

          {/* Upcoming Tests & Interviews Scheduler Calendar */}
          {!loading && calendarEvents.length > 0 && (
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-on-surface text-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">calendar_month</span>
                  Upcoming Schedule
                </h4>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">Events</span>
              </div>
              <div className="divide-y divide-outline-variant">
                {calendarEvents.map((evt) => (
                  <div key={evt.id} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-1 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-on-surface line-clamp-1">{evt.title}</span>
                      <span className="text-[9px] bg-secondary-container text-secondary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        {evt.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-bold">{evt.company}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-primary font-bold mt-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span>{new Date(evt.scheduled_date).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {evt.event_details && (
                      <p className="text-[10px] bg-surface-container p-2 rounded-lg border border-outline-variant/35 text-on-surface-variant font-medium mt-1 select-all break-all">
                        🔗 {evt.event_details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Strength Ring */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col justify-between hover-lift transition-all duration-300">
            <div>
              <h4 className="font-bold text-on-surface text-base">Profile Completeness</h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {profileStrength === 100
                  ? "🎉 Profile complete! Visible to recruiters."
                  : "Complete all fields to boost matching score."}
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
                    className="text-primary transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{profileStrength}%</span>
                  <span className="text-xs text-on-surface-variant">complete</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-outline-variant">
              {[
                { label: "Phone & Contact", value: studentProfile?.phone ? "Done" : "Pending", color: studentProfile?.phone ? "text-secondary" : "text-on-surface-variant" },
                { label: "Resume Link", value: studentProfile?.resume_url ? "Done" : "Pending", color: studentProfile?.resume_url ? "text-secondary" : "text-on-surface-variant" },
                { label: "LinkedIn Account", value: studentProfile?.linkedin_url ? "Done" : "Pending", color: studentProfile?.linkedin_url ? "text-secondary" : "text-on-surface-variant" },
                { label: "Registration Year", value: studentProfile?.registration_year ? "Done" : "Pending", color: studentProfile?.registration_year ? "text-secondary" : "text-on-surface-variant" },
              ].map((row, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant font-medium">{row.label}</span>
                  <span className={`font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines (Rich new addition to Student Dashboard Sidebar) */}
          {!loading && deadlines.length > 0 && (
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-3 hover-lift transition-all duration-300">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-on-surface text-sm">Closing Soonest</h4>
                <span className="text-[10px] bg-error-container text-on-error-container px-2 py-0.5 rounded font-bold uppercase">Critical</span>
              </div>
              <div className="divide-y divide-outline-variant">
                {deadlines.map((opp) => (
                  <div key={opp.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1">
                    <Link to={`/student/opportunities/${opp.id}`} className="text-xs font-bold text-on-surface hover:text-primary transition-colors line-clamp-1">
                      {opp.title}
                    </Link>
                    <div className="flex justify-between items-center text-[10px] text-on-surface-variant">
                      <span>{opp.companies?.profiles?.name}</span>
                      <span className="text-error font-semibold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[10px]">schedule</span>
                        {new Date(opp.apply_deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Action Navigation */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 shadow-sm space-y-3 hover-lift transition-all duration-300">
            <h4 className="font-bold text-on-surface text-sm mb-2">Shortcuts</h4>
            {[
              { to: "/student/opportunities", label: "Browse Job Board", desc: "Find open placements", icon: "work", color: "text-primary bg-primary/10" },
              { to: "/student/applications", label: "Expand Applications", desc: "View timelines & Remarks", icon: "description", color: "text-secondary bg-secondary-container" },
              { to: "/student/profile", label: "Edit Placement Resume", desc: "Update CGPA & skills", icon: "edit_document", color: "text-tertiary bg-tertiary-fixed-dim" },
              { to: "/settings", label: "Account Configuration", desc: "Password & details", icon: "settings", color: "text-on-surface-variant bg-surface-container-high" },
            ].map((link, idx) => (
              <Link
                key={idx}
                to={link.to}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-container-low transition-colors group text-left"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${link.color}`}>
                  <span className="material-symbols-outlined text-lg">{link.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">{link.label}</p>
                  <p className="text-[11px] text-on-surface-variant">{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;