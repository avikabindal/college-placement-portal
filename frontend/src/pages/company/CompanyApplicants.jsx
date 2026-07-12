import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../api/axios";
import ResumeModal from "../../components/ResumeModal";

const BRANCHES = [
  "Computer Science & Engineering",
  "Electronics & Communication",
  "Information Technology",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Chemical Engineering",
];

const CompanyApplicants = () => {
  const location = useLocation();
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Resume Preview Modal State
  const [previewResumeUrl, setPreviewResumeUrl] = useState("");
  const [previewStudentName, setPreviewStudentName] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleOpenResume = (url, name) => {
    setPreviewResumeUrl(url);
    setPreviewStudentName(name);
    setIsPreviewOpen(true);
  };

  // Filter States
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [cgpaFilter, setCgpaFilter] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Scheduler Modal State
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedulerData, setSchedulerData] = useState({
    id: null,
    status: "",
    date: "",
    time: "",
    link: "",
    customRemarks: "",
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const res = await api.get("/opportunities");
        setOpportunities(res.data);
        
        // Check if navigated here with a pre-selected opportunity ID
        const preSelected = location.state?.filterOppId;
        if (preSelected) {
          setSelectedOpp(preSelected);
        } else if (res.data && res.data.length > 0) {
          setSelectedOpp(res.data[0].id);
        } else {
          setSelectedOpp(null);
        }
      } catch (err) {
        setError("Failed to load opportunities.");
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, [location.state]);

  useEffect(() => {
    if (!selectedOpp) return;
    const fetchApplicants = async () => {
      setLoadingApplicants(true);
      try {
        const res = await api.get(`/applications/opportunity/${selectedOpp}`);
        setApplicants(res.data);
        setPage(1); // Reset page to 1 on job switch
      } catch (err) {
        setError("Failed to load applicants.");
      } finally {
        setLoadingApplicants(false);
      }
    };
    fetchApplicants();
  }, [selectedOpp]);

  const handleAction = async (applicationId, status, remarks = "", scheduled_date = null, event_details = null) => {
    setUpdatingId(applicationId);
    try {
      await api.put(`/applications/${applicationId}/status`, {
        status,
        remarks,
        scheduled_date,
        event_details
      });
      setApplicants(applicants.map(a =>
        a.id === applicationId ? { ...a, status, remarks, scheduled_date, event_details } : a
      ));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = (appId, status) => {
    if (status === "interview" || status === "assessment") {
      setSchedulerData({
        id: appId,
        status,
        date: "",
        time: "",
        link: "",
        customRemarks: "",
      });
      setShowScheduler(true);
    } else {
      handleAction(appId, status, "");
    }
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    try {
      // Combine date and time to ISO string
      const dateObj = new Date(`${schedulerData.date}T${schedulerData.time || "00:00"}`);
      const isoDateTime = isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
      
      const eventDetails = `Link/Location: ${schedulerData.link || "N/A"} | Notes: ${schedulerData.customRemarks || "None"}`;
      const formattedRemarks = `Scheduled for ${schedulerData.date} at ${schedulerData.time}`;

      handleAction(schedulerData.id, schedulerData.status, formattedRemarks, isoDateTime, eventDetails);
    } catch (err) {
      console.error("Failed to construct scheduled datetime:", err);
      alert("Invalid date/time input.");
    }
    setShowScheduler(false);
  };

  // Apply filters
  const filteredApplicants = applicants.filter((app) => {
    const student = app.students || {};
    const name = student.profiles?.name?.toLowerCase() || "";
    const email = student.profiles?.email?.toLowerCase() || "";
    const branch = student.branch || "";
    const cgpa = student.cgpa ? parseFloat(student.cgpa) : 0;
    const skills = typeof student.skills === "string"
      ? student.skills.split(",").map(sk => sk.trim()).filter(Boolean)
      : Array.isArray(student.skills) ? student.skills : [];

    const matchesSearch = !search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
    const matchesBranch = branchFilter === "all" || branch === branchFilter;
    const matchesCgpa = !cgpaFilter || cgpa >= parseFloat(cgpaFilter);
    const matchesSkills = !skillSearch || skills.some(s => s.toLowerCase().includes(skillSearch.toLowerCase()));
    
    // Multi-status pipeline filters
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "applied" && ["applied", "under_review", "shared_with_company"].includes(app.status)) ||
      (statusFilter === "interview" && ["assessment", "interview"].includes(app.status)) ||
      app.status === statusFilter;

    return matchesSearch && matchesBranch && matchesCgpa && matchesSkills && matchesStatus;
  });

  // Export filtered list as CSV
  const exportToCSV = () => {
    const headers = ["Name", "Email", "Branch", "CGPA", "Status", "Resume Link", "LinkedIn Link", "Skills"];
    const rows = filteredApplicants.map(app => [
      app.students?.profiles?.name || "",
      app.students?.profiles?.email || "",
      app.students?.branch || "",
      app.students?.cgpa || "",
      app.status || "",
      app.resume_url || app.students?.resume_url || "",
      app.students?.linkedin_url || "",
      typeof app.students?.skills === "string"
        ? app.students.skills.split(",").map(sk => sk.trim()).join("; ")
        : Array.isArray(app.students?.skills)
          ? app.students.skills.join("; ")
          : ""
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `candidates_job_${selectedOpp || "export"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Paginated applicants
  const totalPages = Math.ceil(filteredApplicants.length / PER_PAGE);
  const paginatedApplicants = filteredApplicants.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="p-8 space-y-6 max-w-[1440px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl border border-outline-variant shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Candidate Pool</h1>
          <p className="text-on-surface-variant text-sm mt-1">Review student profiles, inspect resumes, schedule interviews, and export candidate data.</p>
        </div>
        {filteredApplicants.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-5 py-3 border border-outline-variant hover:bg-surface-container text-on-surface-variant rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-sm bg-white"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Export Candidates (CSV)
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm border border-error-container/20">{error}</div>
      )}

      {loading ? (
        <div className="animate-pulse h-12 bg-white rounded-xl border border-outline-variant w-64"></div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-outline-variant shadow-sm">
          <p className="text-4xl mb-3">📭</p>
          <h3 className="text-lg font-bold text-on-surface">No opportunities listed yet</h3>
          <p className="text-on-surface-variant text-sm mt-1">Submit jobs under My Postings to get candidate registrations.</p>
        </div>
      ) : (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Opportunity Select */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Select Opportunity</label>
                <select
                  value={selectedOpp || ""}
                  onChange={(e) => setSelectedOpp(e.target.value)}
                  className="px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full bg-white"
                >
                  {opportunities.map((opp) => (
                    <option key={opp.id} value={opp.id}>{opp.title} ({opp.location})</option>
                  ))}
                </select>
              </div>

              {/* Search input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Search Candidate</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Name or email..."
                  className="px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
                />
              </div>

              {/* Skill Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Skill Keyword</label>
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => { setSkillSearch(e.target.value); setPage(1); }}
                  placeholder="e.g. React, SQL..."
                  className="px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
                />
              </div>

              {/* CGPA minimum */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Minimum CGPA</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={cgpaFilter}
                  onChange={(e) => { setCgpaFilter(e.target.value); setPage(1); }}
                  placeholder="e.g. 7.5"
                  className="px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
                />
              </div>
            </div>

            {/* Branch and Status Filters */}
            <div className="pt-3 border-t border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "All Candidates" },
                  { key: "applied", label: "New / Applied" },
                  { key: "interview", label: "Interview / Assessment" },
                  { key: "shortlisted", label: "Shortlisted" },
                  { key: "selected", label: "Selected" },
                  { key: "rejected", label: "Rejected" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => { setStatusFilter(tab.key); setPage(1); }}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      statusFilter === tab.key
                        ? "bg-primary text-on-primary border-primary shadow-sm"
                        : "bg-surface-bright border-outline-variant text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Branch:</span>
                <select
                  value={branchFilter}
                  onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
                  className="px-3 py-1.5 bg-surface-bright border border-outline-variant rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="all">All Branches</option>
                  {BRANCHES.map(b => (
                    <option key={b} value={b}>{b.replace(" Engineering", "")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Applicants Table */}
          {loadingApplicants ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-outline-variant p-6 h-24 flex items-center justify-between gap-6">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-5 skeleton-loader w-1/3" />
                    <div className="h-3 skeleton-loader w-1/4" />
                  </div>
                  <div className="h-6 skeleton-loader w-20" />
                </div>
              ))}
            </div>
          ) : filteredApplicants.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-2xl border border-outline-variant shadow-sm max-w-lg mx-auto flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">search_off</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">No matching candidates</h3>
                <p className="text-on-surface-variant text-xs mt-1">Try resetting the filters or check another status type.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm hover-lift transition-all duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50 border-b border-outline-variant">
                      <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Candidate</th>
                      <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Branch / Details</th>
                      <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">CGPA</th>
                      <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Resume</th>
                      <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Status / Pipeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {paginatedApplicants.map((app) => {
                      const resumeUrl = app.resume_url || app.students?.resume_url;
                      return (
                        <tr key={app.id} className="hover:bg-surface-container-lowest transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-on-surface text-sm">{app.students?.profiles?.name}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">{app.students?.profiles?.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-on-surface font-medium">{app.students?.branch?.split(" ")[0] || "—"}</p>
                            {(() => {
                              const skills = typeof app.students?.skills === "string"
                                ? app.students.skills.split(",").map(sk => sk.trim()).filter(Boolean)
                                : Array.isArray(app.students?.skills) ? app.students.skills : [];
                              if (skills.length === 0) return null;
                              return (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {skills.slice(0, 3).map((s, idx) => (
                                    <span key={idx} className="text-[10px] bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded font-medium">
                                      {s}
                                    </span>
                                  ))}
                                  {skills.length > 3 && (
                                    <span className="text-[10px] text-on-surface-variant font-medium">+{skills.length - 3} more</span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 text-sm text-on-surface">
                            <span className="font-bold">{app.students?.cgpa || "—"}</span>
                          </td>
                          <td className="px-6 py-4">
                            {resumeUrl ? (
                              <button
                                onClick={() => handleOpenResume(resumeUrl, app.students?.profiles?.name)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                                View CV
                              </button>
                            ) : (
                              <span className="text-xs text-on-surface-variant/50">Not Available</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <select
                              value={app.status}
                              disabled={updatingId === app.id}
                              onChange={(e) => handleStatusChange(app.id, e.target.value)}
                              className="px-3.5 py-1.5 bg-surface-bright border border-outline-variant rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50 cursor-pointer bg-white"
                            >
                              <option value="applied">Applied</option>
                              <option value="under_review">In Review</option>
                              <option value="assessment">Assessment</option>
                              <option value="interview">Interview</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="selected">Selected</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low/20 flex items-center justify-between">
                  <p className="text-xs text-on-surface-variant">
                    Showing {Math.min((page - 1) * PER_PAGE + 1, filteredApplicants.length)}–{Math.min(page * PER_PAGE, filteredApplicants.length)} of {filteredApplicants.length} applicants
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container transition-colors text-sm"
                    >
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          page === i + 1 ? "bg-primary text-on-primary" : "hover:bg-surface-container border border-outline-variant text-on-surface-variant"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container transition-colors text-sm"
                    >
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Test / Interview Scheduler Modal */}
      {showScheduler && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-outline-variant shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Schedule {schedulerData.status.toUpperCase()}
              </h3>
              <button onClick={() => setShowScheduler(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={schedulerData.date}
                    onChange={(e) => setSchedulerData({ ...schedulerData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={schedulerData.time}
                    onChange={(e) => setSchedulerData({ ...schedulerData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Meet Link / Room Location</label>
                <input
                  type="text"
                  placeholder="e.g. Google Meet URL or Room 302"
                  value={schedulerData.link}
                  onChange={(e) => setSchedulerData({ ...schedulerData, link: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Instructions / Notes</label>
                <textarea
                  placeholder="e.g. Prepare system design topics, bring a printout of your resume..."
                  rows={3}
                  value={schedulerData.customRemarks}
                  onChange={(e) => setSchedulerData({ ...schedulerData, customRemarks: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary text-on-primary text-sm font-bold rounded-xl active:scale-95 transition-all shadow-md"
                >
                  Schedule Drive Stage
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduler(false)}
                  className="px-4 py-2.5 border border-outline-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-surface-container transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ResumeModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        resumeUrl={previewResumeUrl}
        studentName={previewStudentName}
      />
    </div>
  );
};

export default CompanyApplicants;