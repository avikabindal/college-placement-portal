import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../api/axios";

const emptyForm = {
  name: "", email: "", password: "",
  description: "", industry: "", location: "",
  contact_email: "", website: "", is_active: true,
};

const ManageCompanies = () => {
  const location = useLocation();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);

  // Search/Filters State
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const fetchCompanies = async () => {
    try {
      const res = await api.get("/companies");
      setCompanies(res.data);
    } catch (err) {
      setError("Failed to load companies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  // Auto-open form if navigated here with openForm state
  useEffect(() => {
    if (location.state?.openForm) {
      openCreateForm();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
    setFormError("");
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("company-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const openEditForm = (company) => {
    setEditingId(company.id);
    setForm({
      name: company.profiles?.name || "",
      email: company.profiles?.email || "",
      password: "",
      description: company.description || "",
      industry: company.industry || "",
      location: company.location || "",
      contact_email: company.contact_email || "",
      website: company.website || "",
      is_active: company.is_active ?? true,
    });
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("company-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  };

  const toggleActiveStatus = async (company) => {
    try {
      const nextStatus = !company.is_active;
      await api.put(`/companies/${company.id}`, { is_active: nextStatus });
      setCompanies(companies.map(c => c.id === company.id ? { ...c, is_active: nextStatus } : c));
    } catch (err) {
      alert("Failed to update company active status.");
    }
  };

  const handleDeleteCompany = async (company) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${company.profiles?.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/companies/${company.id}`);
      setCompanies(companies.filter((c) => c.id !== company.id));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete company.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      if (!form.name || !form.email) { setFormError("Name and email are required"); return; }
      setSubmitting(true);
      try {
        await api.put(`/companies/${editingId}`, {
          name: form.name, email: form.email, description: form.description,
          website: form.website, industry: form.industry, location: form.location,
          contact_email: form.contact_email, is_active: form.is_active,
        });
        closeForm();
        fetchCompanies();
      } catch (err) {
        setFormError(err.response?.data?.error || "Failed to update company.");
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!form.name || !form.email || !form.password) { setFormError("Name, email, and password are required"); return; }
      setSubmitting(true);
      try {
        await api.post("/companies", form);
        closeForm();
        fetchCompanies();
      } catch (err) {
        setFormError(err.response?.data?.error || "Failed to create company.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Unique industries for filter select
  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean)));

  // Filter application
  const filteredCompanies = companies.filter((c) => {
    const name = c.profiles?.name?.toLowerCase() || "";
    const email = c.profiles?.email?.toLowerCase() || "";
    const locationStr = c.location?.toLowerCase() || "";
    const industry = c.industry || "";

    const matchesSearch = !search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase()) || locationStr.includes(search.toLowerCase());
    const matchesIndustry = industryFilter === "all" || industry === industryFilter;

    return matchesSearch && matchesIndustry;
  });

  // Paginated companies
  const totalPages = Math.ceil(filteredCompanies.length / PER_PAGE);
  const paginatedCompanies = filteredCompanies.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="p-8 space-y-6 max-w-[1440px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Partner Recruiters</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage company access, configure account states, and register recruitment credentials.</p>
        </div>
        <button
          onClick={showForm ? closeForm : openCreateForm}
          className="px-5 py-3 bg-primary text-on-primary text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {showForm ? "Cancel" : "+ Add Company"}
        </button>
      </div>

      {showForm && (
        <div id="company-form" className="bg-white rounded-2xl border border-outline-variant p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface mb-4">
            {editingId ? "Edit Company Account" : "Add New Company"}
          </h2>
          {formError && (
            <div className="mb-4 p-3.5 bg-error-container text-on-error-container rounded-xl text-xs flex items-center gap-2 border border-error-container/20">{formError}</div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Company Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                placeholder="e.g. TechCorp Solutions"
                className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Login Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="e.g. hr@techcorp.com"
                className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                required
              />
              {editingId && <p className="text-[11px] text-on-surface-variant italic">Changing this updates their portal login credentials.</p>}
            </div>
            {!editingId && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Industry</label>
              <input type="text" name="industry" value={form.industry} onChange={handleChange}
                placeholder="e.g. Information Technology"
                className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Location</label>
              <input type="text" name="location" value={form.location} onChange={handleChange}
                placeholder="e.g. Bengaluru, India"
                className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Website URL</label>
              <input type="url" name="website" value={form.website} onChange={handleChange}
                placeholder="e.g. https://techcorp.com"
                className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Contact Email</label>
              <input type="email" name="contact_email" value={form.contact_email} onChange={handleChange}
                placeholder="e.g. recruit@techcorp.com"
                className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>

            {/* Active Status Checkbox */}
            <div className="flex items-center gap-2 md:col-span-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="w-4.5 h-4.5 text-primary border-outline-variant rounded focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm font-semibold text-on-surface">
                Is Active (Company is authorized to login & hire)
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Company Description</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="Brief company history, hiring domains..." rows={3}
                className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 bg-primary text-on-primary text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save Changes" : "Create Recruiter")}
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

      {/* Filters & Search bar */}
      <div className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-4 max-w-2xl">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search company name, login email, or location..."
            className="px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary flex-1"
          />
          <select
            value={industryFilter}
            onChange={(e) => { setIndustryFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white min-w-48"
          >
            <option value="all">All Industries</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-on-surface-variant font-bold">
          Found {filteredCompanies.length} companies
        </div>
      </div>

      {error && <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm border border-error-container/20">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-outline-variant p-6 animate-pulse h-20"></div>
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-outline-variant shadow-sm">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30 block mb-2">domain</span>
          <h3 className="text-base font-bold text-on-surface">No companies registered</h3>
          <p className="text-on-surface-variant text-xs mt-1">Register partner organizations to populate recruiters database.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant">
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Industry</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Credentials</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">State</th>
                  <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {paginatedCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-on-surface text-sm">{company.profiles?.name}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 max-w-xs truncate">{company.description || "No description provided."}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface">{company.industry || "—"}</td>
                    <td className="px-6 py-4 text-sm text-on-surface">{company.location || "—"}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{company.profiles?.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                        company.is_active !== false
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}>
                        {company.is_active !== false ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-4 justify-end items-center">
                        <button onClick={() => openEditForm(company)}
                          className="text-xs font-bold text-primary hover:underline cursor-pointer">
                          Edit
                        </button>
                        <button onClick={() => toggleActiveStatus(company)}
                          className={`text-xs font-bold hover:underline cursor-pointer ${
                            company.is_active !== false ? "text-error" : "text-secondary"
                          }`}
                        >
                          {company.is_active !== false ? "Deactivate" : "Activate"}
                        </button>
                        <button onClick={() => handleDeleteCompany(company)}
                          className="text-xs font-bold text-error hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low/20 flex items-center justify-between">
              <p className="text-xs text-on-surface-variant">
                Showing {Math.min((page - 1) * PER_PAGE + 1, filteredCompanies.length)}–{Math.min(page * PER_PAGE, filteredCompanies.length)} of {filteredCompanies.length} companies
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

export default ManageCompanies;