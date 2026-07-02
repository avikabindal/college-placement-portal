import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios"; // adjust path if your axios instance lives elsewhere

export default function Settings() {
  const { user, updateUser } = useAuth(); // confirm AuthContext actually exposes setUser
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage(null);
    try {
      const res = await api.put("/users/profile", { name, email });
      updateUser((prev) => ({ ...prev, name: res.data.user.name, email: res.data.user.email }));
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setSavingPassword(true);
    setMessage(null);
    try {
      await api.put("/users/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Password changed successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to change password." });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-on-surface">Settings</h2>
        <p className="text-on-surface-variant">Manage your account details and password.</p>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === "success"
              ? "bg-secondary-container text-on-secondary-container"
              : "bg-error-container text-on-error-container"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Section */}
      <form onSubmit={handleProfileSave} className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-lg text-on-surface">Account Details</h3>

        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-surface-container border-none rounded-lg focus:ring-2 focus:ring-primary text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-surface-container border-none rounded-lg focus:ring-2 focus:ring-primary text-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {savingProfile ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Password Section */}
      <form onSubmit={handlePasswordSave} className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-lg text-on-surface">Change Password</h3>

        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-1">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 bg-surface-container border-none rounded-lg focus:ring-2 focus:ring-primary text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 bg-surface-container border-none rounded-lg focus:ring-2 focus:ring-primary text-sm"
            required
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 bg-surface-container border-none rounded-lg focus:ring-2 focus:ring-primary text-sm"
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={savingPassword}
          className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {savingPassword ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}