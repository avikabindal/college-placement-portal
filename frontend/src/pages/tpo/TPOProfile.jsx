import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";

const TPOProfile = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(tabParam || "profile");
  const avatarInputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarHover, setAvatarHover] = useState(false);

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "", new_password: "", confirm_password: "",
  });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false, new: false, confirm: false,
  });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState("");

  const fetchProfile = async () => {
    try {
      const res = await api.get("/users/me");
      setProfile(res.data);
      setProfileForm({ name: res.data.name || "", email: res.data.email || "" });
      if (res.data?.avatar_url) {
        setAvatarUrl(res.data.avatar_url);
      }
    } catch (err) {
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  // Load saved avatar from localStorage once we know the user id as local cache/fallback
  useEffect(() => {
    if (!profile?.id) return;
    const saved = localStorage.getItem(`avatar_${profile.id}`);
    if (saved) setAvatarUrl(saved);
  }, [profile?.id]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    setLogsError("");
    try {
      const res = await api.get("/users/tpo-logs");
      setAuditLogs(res.data || []);
    } catch (err) {
      setLogsError("Failed to load audit logs.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") {
      fetchLogs();
    }
  }, [activeTab]);

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
            name: profileForm.name || profile?.name,
            email: profile?.email,
            avatar_url: dataUrl
          });
        } catch (err) {
          console.error("Failed to save avatar to DB:", err);
        }

        if (profile?.id) {
          localStorage.setItem(`avatar_${profile.id}`, dataUrl);
          window.dispatchEvent(new Event("avatarChanged"));
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [profile?.id, profileForm.name, profile?.name, profile?.email]);

  const handleRemoveAvatar = useCallback(async () => {
    setAvatarUrl(null);
    try {
      await api.put("/users/profile", {
        name: profileForm.name || profile?.name,
        email: profile?.email,
        avatar_url: null
      });
    } catch (err) {
      console.error("Failed to remove avatar from DB:", err);
    }
    if (profile?.id) {
      localStorage.removeItem(`avatar_${profile.id}`);
      window.dispatchEvent(new Event("avatarChanged"));
    }
  }, [profile?.id, profileForm.name, profile?.name, profile?.email]);

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    setProfileError("");
    setProfileSuccess("");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setProfileError("Name is required.");
      return;
    }
    setProfileSubmitting(true);
    try {
      // updateProfile requires both name, email, and optionally avatar_url
      const res = await api.put("/users/profile", {
        name: profileForm.name.trim(),
        email: profile.email, // send current email unchanged
        avatar_url: avatarUrl // send current avatar URL
      });
      const updatedName = res.data?.name || profileForm.name.trim();
      setProfile((prev) => ({ ...prev, name: updatedName }));
      setProfileForm((prev) => ({ ...prev, name: updatedName }));
      setProfileSuccess("Profile updated successfully!");
      setEditingProfile(false);
    } catch (err) {
      setProfileError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPasswordError("");
    setPasswordSuccess("");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError("All fields are required.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.new_password === passwordForm.current_password) {
      setPasswordError("New password must be different from current password.");
      return;
    }
    setPasswordSubmitting(true);
    try {
      await api.put("/users/password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordSuccess("Password changed successfully!");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setPasswordError(err.response?.data?.error || "Failed to change password.");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "T";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric", month: "long",
    });
  };

  const toggleShowPassword = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-40 bg-gray-200 rounded-2xl"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account information and security settings</p>
      </div>

      {/* Profile Hero Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-5">
          {/* Hidden file input */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            id="tpo-avatar-input"
          />
          <div className="flex flex-col items-center shrink-0">
            <div
              className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30 cursor-pointer overflow-hidden relative"
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
              onClick={() => avatarInputRef.current?.click()}
              title="Click to change photo"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getInitials(profile?.name)
              )}
              {avatarHover && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-2xl">
                  <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                  <span className="text-white text-[8px] font-semibold mt-0.5">Change</span>
                </div>
              )}
            </div>
            {avatarUrl && (
              <button
                onClick={handleRemoveAvatar}
                className="mt-1 text-[9px] text-white/70 hover:text-white hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{profile?.name}</h2>
            <p className="text-indigo-200 text-sm mt-0.5 truncate">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur">
                Training & Placement Officer
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur">
                Administrator
              </span>
            </div>
          </div>
          <div className="text-right shrink-0 hidden sm:block">
            <p className="text-indigo-200 text-xs">Member since</p>
            <p className="text-white text-sm font-semibold mt-0.5">{formatDateShort(profile?.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Account Status", value: "Active", icon: "verified", color: "text-green-600 bg-green-50" },
          { label: "Role", value: "TPO", icon: "admin_panel_settings", color: "text-indigo-600 bg-indigo-50" },
          { label: "Last Updated", value: formatDateShort(profile?.updated_at), icon: "update", color: "text-gray-600 bg-gray-50" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <span className="material-symbols-outlined text-sm">{icon}</span>
            </div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {[
          { id: "profile", label: "Profile Info", icon: "person" },
          { id: "security", label: "Security", icon: "lock" },
          { id: "audit", label: "Audit Logs", icon: "history" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Profile Information</h3>
              <p className="text-xs text-gray-400 mt-0.5">Update your personal details</p>
            </div>
            {!editingProfile && (
              <button
                onClick={() => { setEditingProfile(true); setProfileSuccess(""); setProfileError(""); }}
                className="flex items-center gap-1.5 px-4 py-2 border border-indigo-200 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <span className="material-symbols-outlined text-base">edit</span>
                Edit
              </button>
            )}
          </div>

          <div className="p-6">
            {profileSuccess && !editingProfile && (
              <div className="mb-5 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                {profileSuccess}
              </div>
            )}

            {editingProfile ? (
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                {profileError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">error</span>
                    {profileError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">info</span>
                    Email address cannot be changed here. Contact your administrator.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={profileSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    {profileSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">save</span>
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileError("");
                      setProfileForm({ name: profile?.name || "", email: profile?.email || "" });
                    }}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-0 divide-y divide-gray-50">
                {[
                  { label: "Full Name", value: profile?.name, icon: "badge" },
                  { label: "Email Address", value: profile?.email, icon: "email" },
                  { label: "Role", value: "Training & Placement Officer", icon: "admin_panel_settings" },
                  { label: "Account Created", value: formatDate(profile?.created_at), icon: "calendar_today" },
                  { label: "Last Updated", value: formatDate(profile?.updated_at), icon: "update" },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center gap-4 py-4">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-indigo-500 text-base">{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
            <p className="text-xs text-gray-400 mt-0.5">Keep your account secure with a strong password</p>
          </div>

          <div className="p-6">
            {passwordError && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-5 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">check_circle</span>
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {[
                { name: "current_password", label: "Current Password", key: "current" },
                { name: "new_password", label: "New Password", key: "new" },
                { name: "confirm_password", label: "Confirm New Password", key: "confirm" },
              ].map(({ name, label, key }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <div className="relative">
                    <input
                      type={showPasswords[key] ? "text" : "password"}
                      name={name}
                      value={passwordForm[name]}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowPassword(key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <span className="material-symbols-outlined text-base">
                        {showPasswords[key] ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {name === "new_password" && (
                    <p className="text-xs text-gray-400 mt-1.5">Must be at least 8 characters</p>
                  )}
                </div>
              ))}

              {/* Password strength hint */}
              {passwordForm.new_password && (
                <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                  <p className="text-xs font-medium text-gray-600">Password strength:</p>
                  <div className="flex gap-1.5">
                    {[8, 12, 16].map((len, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          passwordForm.new_password.length >= len
                            ? i === 0 ? "bg-red-400" : i === 1 ? "bg-yellow-400" : "bg-green-400"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    {passwordForm.new_password.length < 8 ? "Too short" :
                     passwordForm.new_password.length < 12 ? "Weak — try adding numbers or symbols" :
                     passwordForm.new_password.length < 16 ? "Fair — good enough for most accounts" :
                     "Strong password!"}
                  </p>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  {passwordSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                      Changing...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">lock_reset</span>
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-semibold text-gray-900">TPO Profile Audit Logs</h3>
              <p className="text-xs text-gray-400 mt-0.5">History of updates and credentials modifications</p>
            </div>
            <button
              onClick={fetchLogs}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-indigo-600 cursor-pointer flex items-center justify-center"
              title="Refresh logs"
            >
              <span className="material-symbols-outlined text-xl">refresh</span>
            </button>
          </div>

          <div className="p-6">
            {loadingLogs ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2 mt-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : logsError ? (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {logsError}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <span className="material-symbols-outlined text-4xl opacity-40 block mb-2">history</span>
                No audit logs recorded yet.
              </div>
            ) : (
              <div className="relative border-l border-gray-200 ml-4 pl-6 space-y-6">
                {auditLogs.map((log) => {
                  const iconMap = {
                    update_name: "badge",
                    change_password: "key",
                    update_avatar: "photo_camera",
                    remove_avatar: "no_photography",
                    update_email: "mail",
                    create_company: "domain",
                    update_company: "domain_verification",
                    delete_company: "domain_disabled",
                    create_opportunity: "work",
                    update_opportunity: "work_update",
                    approve_opportunity: "playlist_add_check",
                    delete_opportunity: "work_history",
                  };
                  const colorMap = {
                    update_name: "text-indigo-500 bg-indigo-50",
                    change_password: "text-rose-500 bg-rose-50",
                    update_avatar: "text-emerald-500 bg-emerald-50",
                    remove_avatar: "text-amber-500 bg-amber-50",
                    update_email: "text-cyan-500 bg-cyan-50",
                    create_company: "text-purple-500 bg-purple-50",
                    update_company: "text-blue-500 bg-blue-50",
                    delete_company: "text-red-500 bg-red-50",
                    create_opportunity: "text-emerald-500 bg-emerald-50",
                    update_opportunity: "text-violet-500 bg-violet-50",
                    approve_opportunity: "text-teal-500 bg-teal-50",
                    delete_opportunity: "text-orange-500 bg-orange-50",
                  };
                  return (
                    <div key={log.id} className="relative">
                      {/* Timeline bullet */}
                      <span className={`absolute -left-[38px] top-0.5 w-7 h-7 rounded-full flex items-center justify-center border-4 border-white shadow-sm font-semibold text-xs ${colorMap[log.action] || "text-gray-500 bg-gray-50"}`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {iconMap[log.action] || "edit"}
                        </span>
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{log.details}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
                          <span>Changed by:</span>
                          <span className="font-medium text-gray-600">{log.changed_by_profile?.name || "Unknown"} ({log.changed_by_profile?.email || "N/A"})</span>
                          <span className="text-gray-200">•</span>
                          <span>{new Date(log.created_at).toLocaleString("en-IN", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit"
                          })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TPOProfile;