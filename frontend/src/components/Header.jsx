import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);

  // role badge text — adjust to match your actual role values from AuthContext
  const roleLabel =
    user?.role === "tpo"
      ? "TPO Administrator"
      : user?.role === "company"
      ? "Company Recruiter"
      : "Student";

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-background/80 backdrop-blur-md px-6 border-b border-outline-variant flex justify-between items-center">
      <div className="flex items-center gap-6 flex-1">
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

      <div className="flex items-center gap-4">
        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">help_outline</span>
        </button>

        <div className="h-8 w-px bg-outline-variant mx-2" />

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right">
            <p className="text-sm text-on-surface group-hover:text-primary transition-colors">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-on-surface-variant">{roleLabel}</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-primary-container bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || "U"
            )}
          </div>
        </div>
      </div>
    </header>
  );
}