import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";

export default function MainLayout() {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    return () => {
      root.classList.remove("dark");
    };
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      {/* Sidebar drawer */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/50 z-45 md:hidden"
        />
      )}

      {/* Main page content area */}
      <div className={`flex-1 min-h-screen flex flex-col w-full overflow-x-hidden transition-all duration-300 ${
        sidebarOpen ? "md:pl-[270px]" : "pl-0"
      }`}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-grow">
          <Outlet />
        </main>
      </div>
    </div>
  );
}