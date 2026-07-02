import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import api from "../../api/axios";

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

const CompanyApplicants = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const res = await api.get("/opportunities");
        setOpportunities(res.data);
        if (res.data.length > 0) {
          setSelectedOpp(res.data[0].id);
        }
      } catch (err) {
        setError("Failed to load opportunities.");
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, []);

  useEffect(() => {
    if (!selectedOpp) return;
    const fetchApplicants = async () => {
      setLoadingApplicants(true);
      try {
        const res = await api.get(`/applications/opportunity/${selectedOpp}`);
        setApplicants(res.data);
      } catch (err) {
        setError("Failed to load applicants.");
      } finally {
        setLoadingApplicants(false);
      }
    };
    fetchApplicants();
  }, [selectedOpp]);

  const handleAction = async (applicationId, status) => {
    setUpdatingId(applicationId);
    try {
      await api.put(`/applications/${applicationId}/status`, { status });
      setApplicants(applicants.map(a =>
        a.id === applicationId ? { ...a, status } : a
      ));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Applicants</h1>
          <p className="text-gray-500 mt-1">Review and shortlist candidates for your opportunities</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        {loading ? (
          <div className="animate-pulse h-10 bg-white rounded-lg border border-gray-200 w-64"></div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-4xl mb-3">📭</p>
            <h3 className="text-lg font-semibold text-gray-700">No opportunities yet</h3>
            <p className="text-gray-400 text-sm mt-1">The TPO will post opportunities on your behalf</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Opportunity
              </label>
              <select
                value={selectedOpp || ""}
                onChange={(e) => setSelectedOpp(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-64"
              >
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>{opp.title}</option>
                ))}
              </select>
            </div>

            {loadingApplicants ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                ))}
              </div>
            ) : applicants.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <p className="text-4xl mb-3">👥</p>
                <h3 className="text-lg font-semibold text-gray-700">No applicants yet</h3>
                <p className="text-gray-400 text-sm mt-1">Applications will appear here once students apply</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Student</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Branch</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">CGPA</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Skills</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {applicants.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-800">
                            {app.students?.profiles?.name}
                          </p>
                          <p className="text-xs text-gray-400">{app.students?.profiles?.email}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {app.students?.branch || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {app.students?.cgpa || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {app.students?.skills || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(app.status)}`}>
                            {app.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(app.id, "shortlisted")}
                              disabled={updatingId === app.id || app.status === "shortlisted"}
                              className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
                            >
                              Shortlist
                            </button>
                            <button
                              onClick={() => handleAction(app.id, "rejected")}
                              disabled={updatingId === app.id || app.status === "rejected"}
                              className="text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CompanyApplicants;