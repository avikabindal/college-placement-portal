import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";

const STATUS_OPTIONS = [
  "applied", "under_review", "shared_with_company",
  "shortlisted", "assessment", "interview", "selected", "rejected"
];

const statusColor = (status) => {
  const map = {
    applied: "bg-blue-100 text-blue-700",
    under_review: "bg-yellow-100 text-yellow-700",
    shared_with_company: "bg-purple-100 text-purple-700",
    shortlisted: "bg-indigo-100 text-indigo-700",
    assessment: "bg-orange-100 text-orange-700",
    interview: "bg-cyan-100 text-cyan-700",
    selected: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  return map[status] || "bg-gray-100 text-gray-600";
};

const ViewApplicants = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const containerRef = useRef(null); // wraps the whole table

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

  // Close any open dropdown when clicking outside the table entirely,
  // or outside the specific open dropdown's button/menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-status-dropdown]")) {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.put(`/applications/${id}/status`, { status });
      setApplications(applications.map(a =>
        a.id === id ? { ...a, status } : a
      ));
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
      setOpenDropdownId(null);
    }
  };

  const filtered = applications.filter((app) => {
    const name = app.students?.profiles?.name?.toLowerCase() || "";
    const oppTitle = app.opportunities?.title?.toLowerCase() || "";
    const matchesSearch = !search || name.includes(search.toLowerCase()) || oppTitle.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Applications</h1>
          <p className="text-gray-500 mt-1">Track and manage every student application</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or opportunity..."
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-64"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">📋</p>
          <h3 className="text-lg font-semibold text-gray-700">No applications match these filters</h3>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or status filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-visible">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Student</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Opportunity</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Applied</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((app) => {
                const isOpen = openDropdownId === app.id;
                return (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-800">
                        {app.students?.profiles?.name}
                      </p>
                      <p className="text-xs text-gray-400">{app.students?.profiles?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{app.opportunities?.title}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(app.status)}`}>
                        {app.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block text-left" data-status-dropdown>
                        <button
                          type="button"
                          onClick={() => setOpenDropdownId(isOpen ? null : app.id)}
                          disabled={updatingId === app.id}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-1 bg-white"
                        >
                          {updatingId === app.id ? "Updating..." : "Change status"}
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
                            {STATUS_OPTIONS.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => handleStatusChange(app.id, s)}
                                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                                  s === "rejected" ? "text-red-600" : "text-gray-700"
                                } ${s === app.status ? "font-semibold bg-gray-50" : ""}`}
                              >
                                {s.replace(/_/g, " ")}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewApplicants;