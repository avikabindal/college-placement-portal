import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase recovery links redirect to /reset-password#access_token=xxx&type=recovery
    const hash = window.location.hash;
    const search = window.location.search;
    
    let tokenVal = null;
    
    if (hash) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      tokenVal = params.get("access_token");
    }
    
    if (!tokenVal && search) {
      const params = new URLSearchParams(search);
      tokenVal = params.get("access_token");
    }

    if (tokenVal) {
      setToken(tokenVal);
    } else {
      setError("Invalid or expired password reset link. Please request a new link from the login page.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Missing access credentials. Request a new password reset link.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Send token in auth header to let backend identify recovery context
      await api.post(
        "/users/reset-password",
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <div className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative bg-gray-50 items-center justify-center p-4">
        {/* Decorative Circle Gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-white rounded-2xl border border-outline-variant p-8 max-w-md w-full shadow-xl relative overflow-hidden hover-lift transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

          {/* Logo / Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/15 mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">key</span>
            </div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight">Configure New Password</h2>
            <p className="text-xs text-on-surface-variant mt-1.5">Enter your new credentials below to complete recovery.</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-4 text-center">
              <div className="px-4 py-3 bg-green-50 text-green-800 border border-green-200 rounded-xl text-xs font-bold flex items-center gap-2 justify-center">
                <span className="material-symbols-outlined text-sm shrink-0">check_circle</span>
                <span>Your password has been reset successfully!</span>
              </div>
              <p className="text-xs text-on-surface-variant">You can now proceed to login with your new credentials.</p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-all shadow-md text-xs cursor-pointer"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    placeholder="Min 8 characters"
                    className="w-full pl-4 pr-11 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus-glow bg-white"
                    required
                    disabled={loading || !token}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none transition-colors"
                    disabled={loading || !token}
                  >
                    <span className="material-symbols-outlined text-[20px] select-none align-middle">
                      {showNewPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    placeholder="Confirm new password"
                    className="w-full pl-4 pr-11 py-2.5 border border-outline-variant bg-surface-bright rounded-lg text-sm focus-glow bg-white"
                    required
                    disabled={loading || !token}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none transition-colors"
                    disabled={loading || !token}
                  >
                    <span className="material-symbols-outlined text-[20px] select-none align-middle">
                      {showConfirmPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token || !newPassword}
                className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 text-xs cursor-pointer mt-2"
              >
                {loading ? "Saving Credentials..." : "Update Password"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-xs text-on-surface-variant hover:text-primary font-bold hover:underline cursor-pointer"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
