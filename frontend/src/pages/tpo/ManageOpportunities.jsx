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

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const PER_PAGE = 6;

  const fetchData = async () => {
    try {
      const [oppRes, compRes] = await Promise.all([
        api.get("/opportunities"),
        api.get("/companies"),
      ]);
      setOpportunities(oppRes.data);
      setCompanies(compRes.data || []);
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
      setPage(1);
    } catch (err) {
      alert("Failed to delete opportunity.");
    }
  };

  const handleClose = async (id) => {
    if (!window.confirm("Close applications for this opportunity?")) return;
    try {
      await api.put(`/opportunities/${id}`, { status: "closed" });
      setOpportunities(opportunities.map(o => o.id === id ? { ...o, status: "closed" } : o));
    } catch (err) {
      alert("Failed to close opportunity.");
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve and open this opportunity drive for students?")) return;
    try {
      await api.put(`/opportunities/${id}`, { status: "open" });
      setOpportunities(opportunities.map(o => o.id === id ? { ...o, status: "open" } : o));
    } catch (err) {
      alert("Failed to approve opportunity.");
    }
  };

  const statusBadge = (status) => {
    let classes = "bg-gray-50 border-gray-200 text-gray-500";
    if (status === "open") classes = "bg-green-50 border-green-200 text-green-700";
    if (status === "pending") classes = "bg-amber-50 border-amber-200 text-amber-700";
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${classes}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  // Extract unique years from opportunities
  const years = Array.from(
    new Set(
      opportunities
        .map((o) => (o.apply_deadline ? new Date(o.apply_deadline).getFullYear() : null))
        .filter(Boolean)
    )
  ).sort((a, b) => b - a);

  // Apply filters
  const filteredOpps = opportunities.filter((opp) => {
    const title = opp.title?.toLowerCase() || "";
    const company = opp.companies?.profiles?.name?.toLowerCase() || "";
    const matchesSearch = !search || title.includes(search.toLowerCase()) || company.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || opp.status === statusFilter;

    const oppYear = opp.apply_deadline ? new Date(opp.apply_deadline).getFullYear().toString() : "";
    const matchesYear = yearFilter === "all" || oppYear === yearFilter;

    return matchesSearch && matchesStatus && matchesYear;
  });

  // Paginate filtered
  const totalPages = Math.ceil(filteredOpps.length / PER_PAGE);
  const paginatedOpps = filteredOpps.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="p-8 space-y-6 max-w-[1440px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Opportunities</h1>
          <p className="text-on-surface-variant text-sm mt-1">Configure placement criteria, eligible branches, and manage application deadlines.</p>
        </div>
        <button
          onClick={showForm ? closeForm : openCreateForm}
          className="px-5 py-3 bg-primary text-on-primary text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {showForm ? "Cancel" : "+ Post Opportunity"}
        </button>
      </div>

      {showForm && (
        <div id="opp-form" className="bg-white rounded-2xl border border-outline-variant p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface mb-4">
            {editingId ? "Edit Opportunity Details" : "Post New Job/Internship"}
          </h2>
          {formError && (
            <div className="mb-4 p-3.5 bg-error-container text-on-error-container rounded-xl text-xs flex items-center gap-2 border border-error-container/20">{formError}</div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Hiring Company</label>
              <select
                name="company_id"
                value={form.company_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                required
              >
                <option value="">Select partner company...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.profiles?.name} {c.is_active === false ? " (INACTIVE)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Job Title</label>
              <input
                type="text" name="title" value={form.title} onChange={handleChange}
                placeholder="e.g. Software Development Engineer"
                className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            {[
              { name: "location", label: "Job Location", placeholder: "e.g. Bengaluru, India (or Remote)" },
              { name: "stipend", label: "Salary/Stipend", placeholder: "e.g. ₹50,000/mo" },
              { name: "duration", label: "Hiring Duration", placeholder: "e.g. 6 Months (Internship) or Full-Time" },
              { name: "apply_deadline", label: "Deadline Date", type: "date" },
              { name: "cgpa_requirement", label: "Min CGPA Cutoff", placeholder: "e.g. 7.5", type: "number" },
              { name: "eligible_branches", label: "Eligible Departments", placeholder: "e.g. CSE, IT, ECE" },
            ].map(({ name, label, placeholder, type = "text" }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</label>
                <input
                  type={type} name={name} value={form[name]} onChange={handleChange}
                  placeholder={placeholder} step={type === "number" ? "0.1" : undefined}
                  className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Skills Required</label>
              <input
                type="text" name="skills_required" value={form.skills_required} onChange={handleChange}
                placeholder="e.g. React, Node.js, Python, SQL"
                className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Job Description</label>
              <textarea
                name="description" value={form.description} onChange={handleChange}
                placeholder="Job description, eligibility details, test syllabus..." rows={4}
                className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button
                type="submit" disabled={submitting}
                className="px-6 py-2.5 bg-primary text-on-primary text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (editingId ? "Saving..." : "Posting...") : (editingId ? "Save Changes" : "Publish Job")}
              </button>
              <button type="button" onClick={closeForm}
                className="px-6 py-2.5 border border-outline-variant text-on-surface text-sm font-bold rounded-xl hover:bg-surface-container transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-4 max-w-2xl">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search job title or hiring company..."
            className="px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white min-w-36"
          >
            <option value="all">All States</option>
            <option value="open">Open</option>
            <option value="pending">Pending Approval</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={yearFilter}
            onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white min-w-36"
          >
            <option value="all">All Years</option>
            {years.map(y => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-on-surface-variant font-bold">
          Found {filteredOpps.length} opportunities
        </div>
      </div>

      {error && <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm border border-error-container/20">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-outline-variant p-6 animate-pulse h-40"></div>
          ))}
        </div>
      ) : filteredOpps.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-outline-variant shadow-sm">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30 block mb-2">work</span>
          <h3 className="text-base font-bold text-on-surface">No opportunities listed</h3>
          <p className="text-on-surface-variant text-xs mt-1">Publish new recruitment templates to initiate applications.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedOpps.map((opp) => (
              <div key={opp.id} className="bg-white rounded-2xl border border-outline-variant p-6 hover:shadow-sm transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{opp.title}</h3>
                      <p className="text-xs text-primary font-bold mt-1.5">{opp.companies?.profiles?.name}</p>
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
                  <button onClick={() => openEditForm(opp)}
                    className="text-xs px-3.5 py-2 border border-primary/20 hover:border-primary text-primary bg-white rounded-xl font-bold transition-all active:scale-95 cursor-pointer">
                    Edit
                  </button>
                  {opp.status === "pending" && (
                    <button onClick={() => handleApprove(opp.id)}
                      className="text-xs px-3.5 py-2 border border-green-300 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-bold transition-all active:scale-95 cursor-pointer">
                      Approve Drive
                    </button>
                  )}
                  {opp.status === "open" && (
                    <button onClick={() => handleClose(opp.id)}
                      className="text-xs px-3.5 py-2 border border-outline-variant hover:bg-surface-container text-on-surface-variant rounded-xl font-bold transition-all active:scale-95 cursor-pointer">
                      Close Drive
                    </button>
                  )}
                  <button onClick={() => handleDelete(opp.id)}
                    className="text-xs px-3.5 py-2 border border-error/20 text-error hover:bg-error-container/10 rounded-xl font-bold transition-all active:scale-95 cursor-pointer">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-white rounded-2xl border border-outline-variant shadow-sm flex items-center justify-between">
              <p className="text-xs text-on-surface-variant">
                Showing {Math.min((page - 1) * PER_PAGE + 1, filteredOpps.length)}–{Math.min(page * PER_PAGE, filteredOpps.length)} of {filteredOpps.length} opportunities
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
    </div>
  );
};

export default ManageOpportunities;