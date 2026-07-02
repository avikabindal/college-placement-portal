import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../api/axios";

const emptyForm = {
  company_id: "", title: "", description: "", location: "",
  stipend: "", duration: "", apply_deadline: "",
  cgpa_requirement: "", eligible_branches: "", skills_required: "",
};

const ManageOpportunities = () => {
  const location = useLocation();
  const [opportunities, setOpportunities] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    try {
      const [oppRes, compRes] = await Promise.all([
        api.get("/opportunities"),
        api.get("/companies"),
      ]);
      setOpportunities(oppRes.data);
      setCompanies(compRes.data);
    } catch (err) {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-open form if navigated here with openForm state
  useEffect(() => {
    if (location.state?.openForm) {
      openCreateForm();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("opp-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const openEditForm = (opp) => {
    setEditingId(opp.id);
    setForm({
      company_id: opp.company_id || "",
      title: opp.title || "",
      description: opp.description || "",
      location: opp.location || "",
      stipend: opp.stipend || "",
      duration: opp.duration || "",
      apply_deadline: opp.apply_deadline ? opp.apply_deadline.slice(0, 10) : "",
      cgpa_requirement: opp.cgpa_requirement ?? "",
      eligible_branches: opp.eligible_branches || "",
      skills_required: opp.skills_required || "",
    });
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("opp-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_id || !form.title) {
      setFormError("Company and title are required");
      return;
    }
    setSubmitting(true);
    const payload = {
      ...form,
      cgpa_requirement: form.cgpa_requirement ? parseFloat(form.cgpa_requirement) : null,
    };
    try {
      if (editingId) {
        await api.put(`/opportunities/${editingId}`, payload);
      } else {
        await api.post("/opportunities", payload);
      }
      closeForm();
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error || `Failed to ${editingId ? "update" : "create"} opportunity.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this opportunity?")) return;
    try {
      await api.delete(`/opportunities/${id}`);
      setOpportunities(opportunities.filter(o => o.id !== id));
    } catch (err) {
      alert("Failed to delete opportunity.");
    }
  };

  const handleClose = async (id) => {
    try {
      await api.put(`/opportunities/${id}`, { status: "closed" });
      setOpportunities(opportunities.map(o => o.id === id ? { ...o, status: "closed" } : o));
    } catch (err) {
      alert("Failed to close opportunity.");
    }
  };

  const statusBadge = (status) => (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
      status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
    }`}>
      {status}
    </span>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-gray-500 mt-1">Post and manage job listings</p>
        </div>
        <button
          onClick={showForm ? closeForm : openCreateForm}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? "Cancel" : "+ Post Opportunity"}
        </button>
      </div>

      {showForm && (
        <div id="opp-form" className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? "Edit Opportunity" : "Post New Opportunity"}
          </h2>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{formError}</div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select
                name="company_id"
                value={form.company_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select a company...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.profiles?.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text" name="title" value={form.title} onChange={handleChange}
                placeholder="Software Engineer Intern"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {[
              { name: "location", label: "Location", placeholder: "Bengaluru, India" },
              { name: "stipend", label: "Stipend", placeholder: "₹40,000/mo" },
              { name: "duration", label: "Duration", placeholder: "6 months" },
              { name: "apply_deadline", label: "Application Deadline", type: "date" },
              { name: "cgpa_requirement", label: "Min CGPA", placeholder: "7.5", type: "number" },
              { name: "eligible_branches", label: "Eligible Branches", placeholder: "CSE, IT, ECE" },
            ].map(({ name, label, placeholder, type = "text" }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type} name={name} value={form[name]} onChange={handleChange}
                  placeholder={placeholder} step={type === "number" ? "0.1" : undefined}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills Required</label>
              <input
                type="text" name="skills_required" value={form.skills_required} onChange={handleChange}
                placeholder="React, Node.js, PostgreSQL"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description" value={form.description} onChange={handleChange}
                placeholder="Role description and responsibilities..." rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit" disabled={submitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg"
              >
                {submitting ? (editingId ? "Saving..." : "Posting...") : (editingId ? "Save Changes" : "Post Opportunity")}
              </button>
              <button type="button" onClick={closeForm}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">💼</p>
          <h3 className="text-lg font-semibold text-gray-700">No opportunities yet</h3>
          <p className="text-gray-400 text-sm mt-1">Post an opportunity to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div key={opp.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-semibold text-gray-800">{opp.title}</h3>
                    {statusBadge(opp.status)}
                  </div>
                  <p className="text-sm text-indigo-600 font-medium">{opp.companies?.profiles?.name}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                    {opp.location && <span>📍 {opp.location}</span>}
                    {opp.stipend && <span>💰 {opp.stipend}</span>}
                    {opp.duration && <span>⏱ {opp.duration}</span>}
                    {opp.apply_deadline && <span>📅 Deadline: {new Date(opp.apply_deadline).toLocaleDateString()}</span>}
                  </div>
                  {opp.eligible_branches && <p className="text-xs text-gray-400 mt-2">Eligible: {opp.eligible_branches}</p>}
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => openEditForm(opp)}
                    className="text-xs px-3 py-1.5 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50">
                    Edit
                  </button>
                  {opp.status === "open" && (
                    <button onClick={() => handleClose(opp.id)}
                      className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">
                      Close
                    </button>
                  )}
                  <button onClick={() => handleDelete(opp.id)}
                    className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageOpportunities;