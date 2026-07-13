import { useEffect, useState } from "react";
import api from "../../api/axios";
import ResumeModal from "../../components/ResumeModal";

const STATUS_OPTIONS = [
  "applied", "under_review", "shared_with_company",
  "shortlisted", "assessment", "interview", "selected", "rejected"
];

const statusColor = (status) => {
  const map = {
    applied: "bg-blue-50 text-blue-700 border-blue-200",
    under_review: "bg-amber-50 text-amber-800 border-amber-200",
    shared_with_company: "bg-purple-50 text-purple-700 border-purple-200",
    shortlisted: "bg-indigo-50 text-indigo-700 border-indigo-200",
    assessment: "bg-orange-50 text-on-tertiary-fixed-variant border-orange-200",
    interview: "bg-cyan-50 text-cyan-700 border-cyan-200",
    selected: "bg-green-50 text-green-800 border-green-200",
    rejected: "bg-red-50 text-red-800 border-red-200",
  };
  return map[status] || "bg-gray-50 text-gray-600 border-gray-200";
};

const ViewApplicants = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Resume Preview Modal State
  const [previewResumeUrl, setPreviewResumeUrl] = useState("");
  const [previewStudentName, setPreviewStudentName] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleOpenResume = (url, name) => {
    setPreviewResumeUrl(url);
    setPreviewStudentName(name);
    setIsPreviewOpen(true);
  };

  // Pagination State
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const fetchApplications = async () => {
    try {
      const res = await api.get("/applications");
      setApplications(res.data);
    } catch (err) {
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const filtered = applications.filter((app) => {
    const name = app.students?.profiles?.name?.toLowerCase() || "";
    const oppTitle = app.opportunities?.title?.toLowerCase() || "";
    const matchesSearch = !search || name.includes(search.toLowerCase()) || oppTitle.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginated application list
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginatedApps = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="p-8 space-y-6 max-w-[1440px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Placement Pipeline</h1>
          <p className="text-on-surface-variant text-sm mt-1">Review candidates and update status states across all active job postings.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-4 max-w-2xl">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search student name or job title..."
            className="px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white min-w-48"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, " ").toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-on-surface-variant font-bold">
          Found {filtered.length} applications
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm border border-error-container/20">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-outline-variant p-6 h-20 flex items-center justify-between gap-6">
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-5 skeleton-loader w-1/3" />
                <div className="h-3 skeleton-loader w-1/4" />
              </div>
              <div className="h-6 skeleton-loader w-20" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-outline-variant shadow-sm max-w-lg mx-auto flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">search_off</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-on-surface">No matching applications</h3>
            <p className="text-on-surface-variant text-xs mt-1">Adjust search parameters or check another status type.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-outline-variant overflow-visible shadow-sm hover-lift transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant">
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Opportunity</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Applied Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Resume</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {paginatedApps.map((app) => {
                  const resumeUrl = app.resume_url || app.students?.resume_url;
                  return (
                    <tr key={app.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-on-surface text-sm">{app.students?.profiles?.name}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{app.students?.profiles?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-on-surface">{app.opportunities?.title}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {new Date(app.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        {resumeUrl ? (
                          <button
                            onClick={() => handleOpenResume(resumeUrl, app.students?.profiles?.name)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            View Resume
                          </button>
                        ) : (
                          <span className="text-xs text-on-surface-variant/50">Not Available</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2.5 py-0.5 border text-xs font-bold rounded-full ${statusColor(app.status)}`}>
                          {app.status.replace(/_/g, " ")}
                        </span>
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
                Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} applications
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

      <ResumeModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        resumeUrl={previewResumeUrl}
        studentName={previewStudentName}
      />
    </div>
  );
};

export default ViewApplicants;