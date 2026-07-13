import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, updateUser } = useAuth();
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

  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [industry, setIndustry] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);

  useEffect(() => {
    if (user?.role === "company" && user?.id) {
      const fetchCompanyProfile = async () => {
        try {
          const res = await api.get(`/companies/${user.id}`);
          const comp = res.data;
          setDescription(comp.description || "");
          setWebsite(comp.website || "");
          setLocationStr(comp.location || "");
          setContactEmail(comp.contact_email || "");
          setIndustry(comp.industry || "");
        } catch (err) {
          console.error("Failed to load company details");
        }
      };
      fetchCompanyProfile();
    }
  }, [user]);

  const handleCompanySave = async (e) => {
    e.preventDefault();
    setSavingCompany(true);
    setMessage(null);
    try {
      await api.put(`/companies/${user.id}`, {
        description,
        website,
        location: locationStr,
        contact_email: contactEmail,
        industry
      });
      setMessage({ type: "success", text: "Company profile details updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to update company profile details." });
    } finally {
      setSavingCompany(false);
    }
  };

  const getInitials = (name = "") =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  // ── Avatar (stored per-user in localStorage) ──
  const avatarInputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarHover, setAvatarHover] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const fetchAvatar = async () => {
      try {
        const res = await api.get("/users/me");
        if (res.data?.avatar_url) {
          setAvatarUrl(res.data.avatar_url);
        }
      } catch (err) {
        console.error("Failed to fetch avatar from DB:", err);
      }
    };
    fetchAvatar();
    
    const saved = localStorage.getItem(`avatar_${user.id}`);
    if (saved) setAvatarUrl(saved);
  }, [user?.id]);

  const handleAvatarChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const SIZE = 200;
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setAvatarUrl(dataUrl);

        try {
          await api.put("/users/profile", {
            name: name || user?.name,
            email: email || user?.email,
            avatar_url: dataUrl
          });
        } catch (err) {
          console.error("Failed to save avatar to DB:", err);
        }

        if (user?.id) {
          localStorage.setItem(`avatar_${user.id}`, dataUrl);
          window.dispatchEvent(new Event("avatarChanged"));
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [user?.id, name, email, user?.name, user?.email]);

  const handleRemoveAvatar = useCallback(async () => {
    setAvatarUrl(null);
    try {
      await api.put("/users/profile", {
        name: name || user?.name,
        email: email || user?.email,
        avatar_url: null
      });
    } catch (err) {
      console.error("Failed to remove avatar from DB:", err);
    }
    if (user?.id) {
      localStorage.removeItem(`avatar_${user.id}`);
      window.dispatchEvent(new Event("avatarChanged"));
    }
  }, [user?.id]);

  const roleLabels = {
    tpo: "ADMINISTRATOR",
    student: "STUDENT PROFILE",
    company: "RECRUITER PROFILE",
  };

  const roleStyles = {
    tpo: "bg-red-50 text-red-700 border-red-200",
    student: "bg-blue-50 text-blue-700 border-blue-200",
    company: "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <div className="p-8 space-y-6 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Configuration Settings</h1>
        <p className="text-on-surface-variant text-sm mt-1">Configure your login credentials, password controls, and account identifiers.</p>
      </div>

      {message && (
        <div
          className={`px-4 py-3.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {message.type === "success" ? "check_circle" : "error"}
          </span>
          {message.text}
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card & Appearance */}
        <div className="space-y-6 h-fit">
          {/* Profile Card */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden hover-lift transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary/10 to-secondary-container/10 border-b border-outline-variant/35" />
            <div className="relative mt-8">
              {/* Hidden file input */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                id="settings-avatar-input"
              />
              <div
                className="w-24 h-24 rounded-2xl bg-primary text-on-primary font-black text-2xl flex items-center justify-center border-4 border-white shadow-md relative overflow-hidden cursor-pointer"
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                onClick={() => avatarInputRef.current?.click()}
                title="Click to change photo"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials(user?.name)
                )}
                {avatarHover && (
                  <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                    <span className="text-white text-[8px] font-semibold mt-0.5">Change</span>
                  </div>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" title="Active Account" />
            </div>
            {avatarUrl && (
              <button
                onClick={handleRemoveAvatar}
                className="mt-1 text-[10px] text-on-surface-variant hover:text-error hover:underline"
              >
                Remove photo
              </button>
            )}
            
            <div className="mt-4 space-y-1">
              <h3 className="font-extrabold text-on-surface text-lg">{user?.name}</h3>
              <p className="text-xs text-on-surface-variant font-medium">{user?.email}</p>
              <div className="pt-2 flex justify-center">
                <span className={`px-3 py-0.5 border text-[10px] font-bold rounded-full uppercase tracking-wider ${roleStyles[user?.role] || "bg-gray-50 border-gray-200 text-gray-500"}`}>
                  {roleLabels[user?.role] || user?.role}
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant/50 w-full space-y-3.5 text-left text-xs">
              <div className="flex justify-between items-center text-on-surface-variant font-medium">
                <span>Security Level</span>
                <span className="font-bold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-green-600">verified_user</span> Standard
                </span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant font-medium">
                <span>Session State</span>
                <span className="font-bold text-secondary">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Appearance Card */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4 hover-lift transition-all duration-300">
            <h3 className="font-bold text-base text-on-surface">Appearance</h3>
            <p className="text-xs text-on-surface-variant">Customize your application interface theme mode.</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  theme === "light"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-outline-variant hover:bg-surface-container-low text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-xl">light_mode</span>
                <span className="text-xs font-bold">Light Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  theme === "dark"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-outline-variant hover:bg-surface-container-low text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-xl">dark_mode</span>
                <span className="text-xs font-bold">Dark Mode</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Columns: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile form */}
          <form onSubmit={handleProfileSave} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4 hover-lift transition-all duration-300">
            <h3 className="font-bold text-base text-on-surface">Account Identification</h3>
            <p className="text-xs text-on-surface-variant">Update your display name and contact email for the placement portal.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors text-on-surface"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Login Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors text-on-surface"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm active:scale-95 text-xs cursor-pointer"
              >
                {savingProfile ? "Saving..." : "Save Account Details"}
              </button>
            </div>
          </form>

          {user?.role === "company" && (
            <form onSubmit={handleCompanySave} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4 hover-lift transition-all duration-300">
              <h3 className="font-bold text-base text-on-surface">Company Profile Settings</h3>
              <p className="text-xs text-on-surface-variant">Update public branding information for candidate job listings.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Industry Sector</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Information Technology, FinTech"
                    className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Office Location</label>
                  <input
                    type="text"
                    value={locationStr}
                    onChange={(e) => setLocationStr(e.target.value)}
                    placeholder="e.g. Bengaluru, India"
                    className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Website URL</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="e.g. https://example.com"
                    className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Contact Email (for candidates)</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. careers@company.com"
                    className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors text-on-surface"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Company Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a brief pitch about your company culture, core values, and mission..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors text-on-surface"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingCompany}
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm active:scale-95 text-xs cursor-pointer"
                >
                  {savingCompany ? "Saving Details..." : "Save Company Profile"}
                </button>
              </div>
            </form>
          )}

          {/* Password form */}
          <form onSubmit={handlePasswordSave} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4 hover-lift transition-all duration-300">
            <h3 className="font-bold text-base text-on-surface">Security Credentials</h3>
            <p className="text-xs text-on-surface-variant">Modify your login password. We recommend a safe, unique combination of characters.</p>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors text-on-surface"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors text-on-surface"
                    required
                    minLength={8}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 border border-outline-variant bg-surface-bright rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors text-on-surface"
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md active:scale-95 text-xs cursor-pointer"
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}