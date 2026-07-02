import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
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
            className="relative w-full max-w-[480px] bg-white rounded-xl overflow-hidden border border-gray-200"
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
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    <a href="#" className="text-xs font-semibold text-blue-700 hover:underline">
                      Forgot password?
                    </a>
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
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm"
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
      </div>
    </>
  );
};

export default Login;