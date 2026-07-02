import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const StatCard = ({ label, value, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className={`text-3xl font-bold mt-2 ${color}`}>{value ?? 0}</p>
  </div>
);

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/dashboard/company");
        setStats(res.data);
      } catch (err) {
        setError("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name} 👋</h1>
          <p className="text-gray-500 mt-1">Your recruitment overview</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Opportunities" value={stats?.total_opportunities} color="text-indigo-600" />
              <StatCard label="Open Opportunities" value={stats?.open_opportunities} color="text-green-600" />
              <StatCard label="Total Applicants" value={stats?.total} color="text-blue-600" />
              <StatCard label="Shortlisted" value={stats?.shortlisted} color="text-yellow-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Link
                to="/company/applicants"
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div className="text-2xl mb-2">👥</div>
                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600">View Applicants</h3>
                <p className="text-sm text-gray-500 mt-1">Review and shortlist candidates</p>
              </Link>
            </div>

            {stats?.opportunities?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Your Opportunities</h2>
                <div className="space-y-3">
                  {stats.opportunities.map((opp) => (
                    <div key={opp.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <p className="text-sm font-medium text-gray-800">{opp.title}</p>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        opp.status === "open"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {opp.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CompanyDashboard;