import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear location state so the message doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotMessage(null);
    try {
      await api.post("/users/forgot-password", { email: forgotEmail });
      setForgotMessage({ type: "success", text: "A recovery link has been sent to your email!" });
    } catch (err) {
      setForgotMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to send recovery email. Please check the address."
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Both fields are required");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/users/login", form);
      login(res.data.user, res.data.token);
      const role = res.data.user.role;
      if (role === "tpo") navigate("/tpo/dashboard");
      else if (role === "student") navigate("/student/dashboard");
      else if (role === "company") navigate("/company/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Material Symbols font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <div
        className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBa6-P0zqv3qJxXgO5HMN7FiWRHwiTR6nQtvhHqKnXDHf-REdRn5bDBlogVikAAPyl9j9e8HdyzH9mWBobklicVIqcjFjnMLkhyxYFCbLsVHyunV8w5hsBxAlEEa19k7fIgWMjZWrxW7bgbZY2GZHKesQleLxC9Fk93U0UrLtp1Hu-ED9ZF6u9dKofCbyP3RBxuNMJNVI9ryl0mMoU9xDaswdKi4NtuQ8tiyxFJyNSXFBNXrQvdl67zkKUzth7cT0dyOKZfQyb-uMo')",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40 z-0" />

        {/* Main content */}
        <main className="flex-grow flex items-center justify-center p-6 relative z-10">
          <div
            className="relative w-full max-w-[480px] bg-white rounded-xl overflow-hidden border border-gray-200 hover-lift transition-all duration-300"
            style={{
              boxShadow:
                "0 4px 24px -2px rgba(0,55,176,0.08), 0 2px 8px -2px rgba(0,55,176,0.04)",
            }}
          >
            <div className="px-8 pb-10 pt-10">
              {/* Brand */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <span
                    className="material-symbols-outlined text-white"
                    style={{ fontVariationSettings: "'FILL' 1", fontSize: "28px" }}
                  >
                    school
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">CareerConnect</h1>
                <p className="text-sm text-gray-500 mt-1">College Placement Portal</p>
              </div>

              {/* Form */}
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-gray-900">Login</h2>
                  <p className="text-sm text-gray-500">Access your placement dashboard</p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs font-bold flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm shrink-0 text-green-600">check_circle</span>
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <div className="relative">
                    <span
                      className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      style={{ fontSize: "20px" }}
                    >
                      mail
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="name@university.edu"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus-glow transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(true);
                        setForgotEmail("");
                        setForgotMessage(null);
                      }}
                      className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer bg-transparent border-0 outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <span
                      className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      style={{ fontSize: "20px" }}
                    >
                      lock
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus-glow transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-4 rounded-lg font-semibold text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? "Logging in..." : "Login"}
                  {!loading && (
                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                      login
                    </span>
                  )}
                </button>
              </form>

              {/* Stats */}
              <div className="mt-8 pt-8 border-t border-gray-200 flex justify-around items-center text-center">
                <div className="space-y-1">
                  <span className="material-symbols-outlined text-blue-700">corporate_fare</span>
                  <p className="text-sm font-bold text-gray-800">500+</p>
                  <p className="text-xs text-gray-500">Companies</p>
                </div>
                <div className="space-y-1">
                  <span className="material-symbols-outlined text-blue-700">groups</span>
                  <p className="text-sm font-bold text-gray-800">10k+</p>
                  <p className="text-xs text-gray-500">Students</p>
                </div>
                <div className="space-y-1">
                  <span className="material-symbols-outlined text-blue-700">verified</span>
                  <p className="text-sm font-bold text-gray-800">95%</p>
                  <p className="text-xs text-gray-500">Placement</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-blue-700 font-medium hover:underline">
                    Register here
                  </Link>
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Having trouble logging in?{" "}
                  <a href="#" className="text-blue-700 font-medium hover:underline">
                    Contact Administrator
                  </a>
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center relative z-10">
          <p className="text-xs text-white/70">© 2024 CareerConnect. All rights reserved.</p>
        </footer>
        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-outline-variant p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Password Recovery</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Enter your account email below, and we will send you a secure password reset link.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="p-1 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {forgotMessage && (
                <div
                  className={`mb-4 px-3.5 py-2.5 rounded-xl text-xs font-bold border ${
                    forgotMessage.type === "success"
                      ? "bg-green-50 text-green-800 border-green-200"
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}
                >
                  {forgotMessage.text}
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotMessage(null); }}
                    placeholder="e.g. name@university.edu"
                    className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus-glow bg-white"
                    required
                    disabled={forgotLoading}
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 border border-outline-variant text-on-surface text-xs font-bold rounded-xl hover:bg-surface-container transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotEmail}
                    className="px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    {forgotLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Login;