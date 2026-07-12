import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    tpo_key: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!form.email.toLowerCase().endsWith("@jietjodhpur.ac.in")) {
      setError("Only @jietjodhpur.ac.in emails are allowed to register.");
      return;
    }
    if (form.role === "tpo" && !form.tpo_key) {
      setError("TPO secret registration key is required.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/users/register", form);
      navigate("/login", { state: { message: "Account created successfully! A confirmation link has been sent to your email. Please verify it before logging in." } });
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-primary-fixed-dim via-background to-surface-variant flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary text-3xl font-variation-settings-'FILL'-1">school</span>
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">CareerConnect</h1>
          <p className="text-on-surface-variant text-sm mt-1">Campus Placement & Internship Portal</p>
        </div>

        <div className="glass-card rounded-2xl border border-outline-variant p-8 shadow-xl bg-white/95 hover-lift transition-all duration-300">
          <h2 className="text-xl font-bold text-on-surface mb-6">Create Account</h2>

          {error && (
            <div className="mb-5 p-3.5 bg-error-container text-on-error-container rounded-xl text-xs flex items-center gap-2 border border-error-container/20">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Priya Sharma"
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus-glow transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@college.edu"
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus-glow transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  className="w-full pl-4 pr-12 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus-glow transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Select Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus-glow transition-all"
              >
                <option value="student">Student</option>
                <option value="tpo">TPO (Training & Placement Officer)</option>
              </select>
              <p className="text-xs text-on-surface-variant/70 mt-1.5 italic">
                * Company recruiter accounts are generated by the TPO.
              </p>
            </div>

            {form.role === "tpo" && (
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  TPO Secret Registration Key
                </label>
                <input
                  type="password"
                  name="tpo_key"
                  value={form.tpo_key}
                  onChange={handleChange}
                  placeholder="Enter secret registration key"
                  className="w-full px-4 py-2.5 bg-surface-bright border border-outline-variant rounded-lg text-sm focus-glow transition-all"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-primary text-on-primary font-bold rounded-xl text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="material-symbols-outlined text-base animate-spin">refresh</span> Registering...</>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;