import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";

export default function Header({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setAvatarUrl(null);
      return;
    }
    const updateAvatar = () => {
      const saved = localStorage.getItem(`avatar_${user.id}`);
      setAvatarUrl(saved);
    };
    updateAvatar();

    window.addEventListener("avatarChanged", updateAvatar);
    window.addEventListener("storage", updateAvatar);
    return () => {
      window.removeEventListener("avatarChanged", updateAvatar);
      window.removeEventListener("storage", updateAvatar);
    };
  }, [user?.id]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get("/users/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/users/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/users/notifications/mark-read");
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const roleLabel =
    user?.role === "tpo"
      ? "TPO Administrator"
      : user?.role === "company"
      ? "Company Recruiter"
      : "Student";

  const profileLink =
    user?.role === "tpo"
      ? "/tpo/profile"
      : user?.role === "company"
      ? "/settings"
      : "/student/profile";

  // Format time helper
  const formatTimeAgo = (dateStr) => {
    const diffMs = new Date() - new Date(dateStr);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-background/80 backdrop-blur-md px-6 border-b border-outline-variant flex justify-between items-center gap-4">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors rounded-xl flex items-center justify-center cursor-pointer"
          aria-label="Open sidebar"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div
          className={`relative w-full max-w-md rounded-full transition-all ${
            searchFocused ? "ring-2 ring-primary/20" : ""
          }`}
        >
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Search students, companies..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container border-none rounded-full focus:ring-0 text-sm transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        <button
          onClick={toggleTheme}
          className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-xl flex items-center justify-center cursor-pointer"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <span className="material-symbols-outlined">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
        </button>

        {/* Notifications Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 text-on-surface-variant hover:text-primary transition-colors rounded-xl flex items-center justify-center relative cursor-pointer ${
              isOpen ? "bg-surface-container-high text-primary" : ""
            }`}
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </button>

          {isOpen && (
            <>
              {/* Overlay backdrop to close dropdown */}
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              
              <div className="absolute right-0 mt-2.5 w-80 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl z-20 overflow-hidden flex flex-col hover-lift transition-all duration-300">
                <div className="px-4.5 py-3 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
                  <h3 className="font-bold text-on-surface text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-bold text-primary hover:underline bg-transparent border-none outline-none cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                
                <div className="overflow-y-auto flex-1 divide-y divide-outline-variant max-h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-on-surface-variant text-xs">
                      <span className="material-symbols-outlined text-3xl opacity-35 block mb-1">notifications_active</span>
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!item.is_read) handleMarkRead(item.id);
                        }}
                        className={`p-3.5 text-left transition-colors cursor-pointer flex gap-3.5 relative hover:bg-surface-container-low ${
                          !item.is_read ? "bg-primary/5" : ""
                        }`}
                      >
                        {!item.is_read && (
                          <span className="absolute top-4.5 right-4 w-2 h-2 bg-primary rounded-full" />
                        )}
                        <div className="flex-1 space-y-1">
                          <p className={`text-xs ${!item.is_read ? "font-extrabold text-on-surface" : "font-semibold text-on-surface-variant"}`}>
                            {item.title}
                          </p>
                          <p className="text-[11px] text-on-surface-variant/85 leading-relaxed">
                            {item.message}
                          </p>
                          <p className="text-[10px] text-on-surface-variant/60 font-semibold">
                            {formatTimeAgo(item.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
 
        <div className="h-8 w-px bg-outline-variant mx-2" />
 
        <Link to={profileLink} className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right">
            <p className="text-sm text-on-surface group-hover:text-primary transition-colors">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-on-surface-variant">{roleLabel}</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-primary-container bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={user?.name || "User"} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || "U"
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}