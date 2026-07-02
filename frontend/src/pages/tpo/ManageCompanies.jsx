import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../api/axios";

const emptyForm = {
  name: "", email: "", password: "",
  description: "", industry: "", location: "",
  contact_email: "", website: "",
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
    setForm({ ...form, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      if (!form.name || !form.email) { setFormError("Name and email are required"); return; }
      setSubmitting(true);
      try {
        await api.put(`/companies/${editingId}`, {
          name: form.name, email: form.email, description: form.description,
          website: form.website, industry: form.industry, location: form.location,
          contact_email: form.contact_email,
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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this company? This cannot be undone.")) return;
    try {
      await api.delete(`/companies/${id}`);
      setCompanies(companies.filter(c => c.id !== id));
    } catch (err) {
      alert("Failed to delete company.");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-500 mt-1">Manage company accounts</p>
        </div>
        <button
          onClick={showForm ? closeForm : openCreateForm}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Company"}
        </button>
      </div>

      {showForm && (
        <div id="company-form" className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? "Edit Company" : "Add New Company"}
          </h2>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{formError}</div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                placeholder="TechCorp Solutions"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Login Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="hr@techcorp.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {editingId && <p className="text-xs text-gray-400 mt-1">Changing this updates their login email.</p>}
            </div>
            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
            {[
              { name: "industry", label: "Industry", placeholder: "Information Technology" },
              { name: "location", label: "Location", placeholder: "Bengaluru, India" },
              { name: "website", label: "Website", placeholder: "https://techcorp.com" },
              { name: "contact_email", label: "Contact Email", placeholder: "contact@techcorp.com", type: "email" },
            ].map(({ name, label, placeholder, type = "text" }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} name={name} value={form[name]} onChange={handleChange}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="Brief company description..." rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {submitting ? (editingId ? "Saving..." : "Creating...") : (editingId ? "Save Changes" : "Create Company")}
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
      ) : companies.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-3">🏢</p>
          <h3 className="text-lg font-semibold text-gray-700">No companies yet</h3>
          <p className="text-gray-400 text-sm mt-1">Add a company to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Company</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Industry</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Location</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Email</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-800">{company.profiles?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{company.description?.slice(0, 50)}{company.description?.length > 50 ? "..." : ""}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{company.industry || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{company.location || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{company.profiles?.email}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button onClick={() => openEditForm(company)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mr-4">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(company.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageCompanies;