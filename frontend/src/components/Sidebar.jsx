import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const navConfig = {
tpo: {
brand: "College Placement Portal",
items: [
      { to: "/tpo/dashboard", label: "Dashboard", icon: "dashboard" },
      { to: "/tpo/opportunities", label: "Opportunities", icon: "work" },
      { to: "/tpo/applications", label: "Applications", icon: "description" },
      { to: "/tpo/companies", label: "Companies", icon: "domain" },
      { to: "/tpo/profile", label: "My Profile", icon: "person" },
    ],
cta: { to: "/tpo/opportunities", label: "New Opportunity", icon: "add_circle" },
  },
student: {
brand: "Student Portal",
items: [
      { to: "/student/dashboard", label: "Dashboard", icon: "dashboard" },
      { to: "/student/opportunities", label: "Browse Opportunities", icon: "work" },
      { to: "/student/applications", label: "My Applications", icon: "description" },
      { to: "/student/profile", label: "Profile", icon: "person" },
    ],
cta: { to: "/student/opportunities", label: "Find Opportunities", icon: "search" },
  },
company: {
brand: "Company Portal",
items: [
      { to: "/company/dashboard", label: "Dashboard", icon: "dashboard" },
      { to: "/company/applicants", label: "Applicants", icon: "groups" },
    ],
cta: { to: "/company/applicants", label: "View Applicants", icon: "groups" },
  },
};
export default function Sidebar() {
const { user, logout } = useAuth();
if (!user) return null;
const config = navConfig[user.role] || navConfig.student;
const linkClasses = ({ isActive }) =>
`flex items-center gap-3 px-4 py-3 rounded-r-lg transition-all duration-200 text-body-md ${
isActive
        ? "border-l-4 border-primary bg-primary-container text-on-primary-container font-semibold"
        : "text-on-surface-variant hover:bg-surface-container-high rounded-lg"
}`;
return (
<aside className="fixed left-0 top-0 h-full w-[260px] bg-surface border-r border-outline-variant flex flex-col overflow-y-auto z-50">
{/* Brand Header */}
<div className="px-6 py-8">
<div className="flex items-center gap-3">
<div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
<span
className="material-symbols-outlined text-on-primary"
style={{ fontVariationSettings: "'FILL' 1" }}
>
              school
</span>
</div>
<div>
<h1 className="text-lg font-bold text-primary leading-tight">CareerConnect</h1>
<p className="text-xs text-on-surface-variant">{config.brand}</p>
</div>
</div>
</div>
{/* Navigation Links */}
<nav className="flex-1 px-3 space-y-1">
{config.items.map((item) => (
<NavLink key={item.to} to={item.to} className={linkClasses}>
<span className="material-symbols-outlined">{item.icon}</span>
<span>{item.label}</span>
</NavLink>
        ))}
</nav>
{/* CTA & Footer */}
<div className="p-6 space-y-4">
<NavLink
to={config.cta.to}
className="w-full bg-primary text-on-primary py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
>
<span className="material-symbols-outlined">{config.cta.icon}</span>
{config.cta.label}
</NavLink>
<div className="pt-4 border-t border-outline-variant space-y-1">
<NavLink
to="/settings"
className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg text-sm"
>
<span className="material-symbols-outlined">settings</span>
<span>Settings</span>
</NavLink>
<button
onClick={logout}
className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg text-sm text-left"
>
<span className="material-symbols-outlined">logout</span>
<span>Logout</span>
</button>
</div>
</div>
</aside>
  );
}