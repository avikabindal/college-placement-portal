import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navConfig = {
  tpo: {
    brand: "Placement Board",
    items: [
      { to: "/tpo/dashboard", label: "Overview", icon: "dashboard" },
      { to: "/tpo/opportunities", label: "Job Postings", icon: "work" },
      { to: "/tpo/applications", label: "Applications", icon: "description" },
      { to: "/tpo/companies", label: "Recruiters", icon: "domain" },
      { to: "/tpo/profile", label: "My Profile", icon: "person" },
    ],
    cta: { to: "/tpo/opportunities", label: "New Drive", icon: "add_circle" },
  },
  student: {
    brand: "Student Portal",
    items: [
      { to: "/student/dashboard", label: "Dashboard", icon: "dashboard" },
      { to: "/student/opportunities", label: "Job Openings", icon: "work" },
      { to: "/student/applications", label: "My Pipeline", icon: "description" },
      { to: "/student/profile", label: "My Profile", icon: "person" },
    ],
    cta: { to: "/student/opportunities", label: "Explore Jobs", icon: "search" },
  },
  company: {
    brand: "Recruiter Console",
    items: [
      { to: "/company/dashboard", label: "Overview", icon: "dashboard" },
      { to: "/company/opportunities", label: "My Postings", icon: "work" },
      { to: "/company/applicants", label: "Candidates", icon: "groups" },
    ],
    cta: { to: "/company/opportunities", label: "Post Opportunity", icon: "add_circle" },
  },
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const config = navConfig[user.role] || navConfig.student;

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3.5 px-5 py-3.5 mx-3 rounded-xl transition-all duration-300 group text-sm font-semibold relative ${
      isActive
        ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-[1.02]"
        : "text-on-surface-variant hover:bg-primary/10 hover:text-primary"
    }`;

  return (
    <aside className={`fixed left-0 top-0 h-full w-[270px] bg-surface-container-lowest border-r border-outline-variant/60 flex flex-col justify-between z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`}>
      <div>
        {/* Brand Header */}
        <div className="px-6 pt-8 pb-6 border-b border-outline-variant/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-primary text-on-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="material-symbols-outlined text-[22px] relative z-10 font-variation-settings-'FILL'-1">school</span>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-on-surface tracking-tight leading-none">CareerConnect</h1>
              <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-wider">{config.brand}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 space-y-1.5">
          {config.items.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              className={linkClasses} 
              onClick={() => { if (window.innerWidth < 768) onClose(); }}
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? "text-white" : "text-on-surface-variant"
                  }`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* CTA & Footer */}
      <div className="p-5 border-t border-outline-variant/40 space-y-4">
        <NavLink
          to={config.cta.to}
          state={{ openForm: true }}
          onClick={() => { if (window.innerWidth < 768) onClose(); }}
          className="w-full bg-surface-container-high border border-outline-variant/65 hover:border-primary/50 text-on-surface py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary hover:text-on-primary hover:shadow-lg hover:shadow-primary/15 transition-all duration-300"
        >
          <span className="material-symbols-outlined text-sm">{config.cta.icon}</span>
          {config.cta.label}
        </NavLink>
        
        <div className="pt-2.5 space-y-1">
          <NavLink
            to="/settings"
            onClick={() => { if (window.innerWidth < 768) onClose(); }}
            className="flex items-center gap-3 px-5 py-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all rounded-xl text-xs font-bold group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:rotate-45 transition-transform duration-500">settings</span>
            Settings
          </NavLink>
          <button
            onClick={() => { if (window.innerWidth < 768) onClose(); logout(); }}
            className="w-full flex items-center gap-3 px-5 py-3 text-on-surface-variant hover:bg-red-50 hover:text-error transition-all rounded-xl text-xs font-bold text-left group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform duration-300">logout</span>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}