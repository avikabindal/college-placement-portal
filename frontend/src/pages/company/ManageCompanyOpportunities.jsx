import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  title: "", description: "", location: "",
  stipend: "", duration: "", apply_deadline: "",
  cgpa_requirement: "", eligible_branches: "", skills_required: "",
};

export default function ManageCompanyOpportunities() {
  const { user } = useAuth();
  const location = useLocation();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);

  // Auto-open form if navigated here with openForm state
  useEffect(() => {
    if (location.state?.openForm) {
      openCreateForm();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchOpportunities = async () => {
    try {
      const res = await api.get("/opportunities");
      // Filter for opportunities posted by this company
      setOpportunities(res.data.filter(opp => opp.company_id === user.id));
    } catch (err) {
      setError("Failed to load your postings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchOpportunities();
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (opp) => {
    setEditingId(opp.id);
    setForm({
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
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      setFormError("Job title is required");
      return;
    }
    setSubmitting(true);
    const payload = {
      ...form,
      company_id: user.id,
      posted_by: user.id,
      cgpa_requirement: form.cgpa_requirement ? parseFloat(form.cgpa_requirement) : null,
      status: "pending", // Always set recruiter postings as pending
    };
    try {
      if (editingId) {
        await api.put(`/opportunities/${editingId}`, payload);
      } else {
        await api.post("/opportunities", payload);
      }
      closeForm();
      fetchOpportunities();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to submit opportunity.");
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
      alert(err.response?.data?.error || "Failed to delete opportunity.");
    }
  };

  const statusBadge = (status) => {
    let classes = "bg-gray-50 border-gray-200 text-gray-500";
    if (status === "open") classes = "bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400";
    if (status === "pending") classes = "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400";
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${classes}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6 max-w-[1440px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 rounded-2xl border border-outline-variant shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">My Postings</h1>
          <p className="text-on-surface-variant text-sm mt-1">Submit job recruitment drives for TPO approval and candidate registrations.</p>
        </div>
        <button
          onClick={showForm ? closeForm : openCreateForm}
          className="px-5 py-3 bg-primary text-on-primary text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer hover:opacity-90"
        >
          {showForm ? "Cancel" : "+ Post New Drive"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-outline-variant p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface mb-4">
            {editingId ? "Edit Posting Details" : "Create New Recruitment Drive"}
          </h2>
          {formError && (
            <div className="mb-4 p-3.5 bg-error-container text-on-error-container rounded-xl text-xs border border-error-container/20">{formError}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Job Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineer Intern"
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Location</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Bengaluru, India (Hybrid)"
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Stipend / Salary</label>
                <input
                  type="text"
                  name="stipend"
                  value={form.stipend}
                  onChange={handleChange}
                  placeholder="e.g. ₹50,000/month or 12 LPA"
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Duration</label>
                <input
                  type="text"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  placeholder="e.g. 6 Months or Full-Time"
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Apply Deadline</label>
                <input
                  type="date"
                  name="apply_deadline"
                  value={form.apply_deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Min CGPA Requirement</label>
                <input
                  type="number"
                  step="0.01"
                  name="cgpa_requirement"
                  value={form.cgpa_requirement}
                  onChange={handleChange}
                  placeholder="e.g. 7.5"
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Eligible Branches</label>
              <input
                type="text"
                name="eligible_branches"
                value={form.eligible_branches}
                onChange={handleChange}
                placeholder="e.g. CSE, IT, ECE (comma separated)"
                className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Skills Required</label>
              <input
                type="text"
                name="skills_required"
                value={form.skills_required}
                onChange={handleChange}
                placeholder="e.g. React, Node.js, SQL"
                className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Job Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Write detailed responsibilities, qualifications, and role specifics..."
                rows={5}
                className="w-full px-4 py-2.5 border border-outline-variant rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : editingId ? "Save Updates" : "Submit for Approval"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-5 py-2.5 border border-outline-variant text-on-surface-variant text-sm font-semibold rounded-xl hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm border border-error-container/20">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-outline-variant p-6 animate-pulse h-48" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-outline-variant shadow-sm">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30 block mb-2">work</span>
          <h3 className="text-base font-bold text-on-surface">No postings found</h3>
          <p className="text-on-surface-variant text-xs mt-1">Submit your first placement drive using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {opportunities.map((opp) => (
            <div key={opp.id} className="bg-white rounded-2xl border border-outline-variant p-6 hover:shadow-sm transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{opp.title}</h3>
                    <p className="text-xs text-primary font-bold mt-1.5">{user.name}</p>
                  </div>
                  {statusBadge(opp.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4 text-xs text-on-surface-variant font-medium">
                  {opp.location && <span>📍 {opp.location}</span>}
                  {opp.stipend && <span>💰 {opp.stipend}</span>}
                  {opp.duration && <span>⏱ {opp.duration}</span>}
                  {opp.apply_deadline && <span>📅 Deadline: {new Date(opp.apply_deadline).toLocaleDateString()}</span>}
                </div>
                
                {opp.eligible_branches && (
                  <div className="mt-4 pt-3 border-t border-outline-variant">
                    <p className="text-[11px] text-on-surface-variant font-semibold">ELIGIBLE BRANCHES</p>
                    <p className="text-xs text-on-surface font-semibold mt-1">{opp.eligible_branches}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-outline-variant">
                {opp.status === "pending" ? (
                  <>
                    <button onClick={() => openEditForm(opp)}
                      className="text-xs px-3.5 py-2 border border-primary/20 hover:border-primary text-primary bg-white rounded-xl font-bold transition-all active:scale-95 cursor-pointer">
                      Edit Details
                    </button>
                    <button onClick={() => handleDelete(opp.id)}
                      className="text-xs px-3.5 py-2 border border-error/20 text-error hover:bg-error-container/10 rounded-xl font-bold transition-all active:scale-95 cursor-pointer">
                      Delete
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-on-surface-variant/70 italic flex items-center gap-1 font-semibold select-none">
                    <span className="material-symbols-outlined text-sm font-variation-settings-'FILL'-1">lock</span>
                    Locked (TPO Approved)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
