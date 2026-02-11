import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { useAppDispatch } from "../../store/hooks"; // adjust path
import { logout } from "../../store/slices/authSlice";

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const linkClass =
    "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group text-sm font-medium mb-1 whitespace-nowrap";

  const activeClass =
    "bg-[#c2a336] text-[#1a3a32] shadow-lg shadow-[#c2a336]/20";
  const inactiveClass = "text-gray-300 hover:bg-white/5 hover:text-white";

  // Logout handler
  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <>
      {/* MOBILE TRIGGER */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-3 bg-[#1a3a32] text-[#c2a336] rounded-xl shadow-2xl border border-white/10"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 lg:sticky lg:top-0 h-screen 
          bg-[#1a3a32] text-white flex flex-col shadow-2xl shrink-0 transition-all duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-64`}
      >
        {/* COLLAPSE TOGGLE (Desktop Only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-[#c2a336] text-[#1a3a32] rounded-full items-center justify-center border-2 border-[#1a3a32] hover:scale-110 transition-transform z-50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand Identity */}
        <div className={`p-8 border-b border-white/10 transition-all ${isCollapsed ? "px-4" : ""}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-[#c2a336]/10 rounded-lg shrink-0">
              <ShieldCheck className="text-[#c2a336] w-6 h-6" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                <h2 className="text-xs font-black tracking-[0.2em] uppercase">Admin</h2>
                <p className="text-[10px] text-[#8c94a4] font-bold uppercase tracking-tight">
                  Judiciary System
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 mt-4 overflow-y-auto no-scrollbar">
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-[#8c94a4] uppercase tracking-widest px-4 mb-4">
              Main Menu
            </p>
          )}

          <div className="space-y-1">
            <SidebarLink
              to="/admin/dashboard"
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              isCollapsed={isCollapsed}
              activeClass={activeClass}
              inactiveClass={inactiveClass}
              linkClass={linkClass}
            />
            <SidebarLink
              to="/admin/indicators"
              icon={<FileText size={18} />}
              label="All Indicators"
              isCollapsed={isCollapsed}
              activeClass={activeClass}
              inactiveClass={inactiveClass}
              linkClass={linkClass}
            />
            <SidebarLink
              to="/admin/submitted"
              icon={<FileText size={18} />}
              label="Submitted For Review"
              isCollapsed={isCollapsed}
              activeClass={activeClass}
              inactiveClass={inactiveClass}
              linkClass={linkClass}
            />
            <SidebarLink
              to="/admin/approved"
              icon={<FileText size={18} />}
              label="Approved Items"
              isCollapsed={isCollapsed}
              activeClass={activeClass}
              inactiveClass={inactiveClass}
              linkClass={linkClass}
            />

            <SidebarLink
              to="/admin/rejections"
              icon={<FileText size={18} />}
              label="Rejected Items"
              isCollapsed={isCollapsed}
              activeClass={activeClass}
              inactiveClass={inactiveClass}
              linkClass={linkClass}
            />

            <SidebarLink
              to="/admin/uploads"
              icon={<FileText size={18} />}
              label="Upload Evidence"
              isCollapsed={isCollapsed}
              activeClass={activeClass}
              inactiveClass={inactiveClass}
              linkClass={linkClass}
            />
            
          </div>

          <div className={`my-6 border-t border-white/5 pt-6 ${isCollapsed ? "px-0" : ""}`}>
            {!isCollapsed && (
              <p className="text-[10px] font-bold text-[#8c94a4] uppercase tracking-widest px-4 mb-4">
                Preferences
              </p>
            )}
            <SidebarLink
              to="/admin/settings"
              icon={<Settings size={18} />}
              label="Settings"
              isCollapsed={isCollapsed}
              activeClass={activeClass}
              inactiveClass={inactiveClass}
              linkClass={linkClass}
            />

            <SidebarLink
              to="/admin/reports"
              icon={<BarChart3 size={18} />}
              label="Reports"
              isCollapsed={isCollapsed}
              activeClass={activeClass}
              inactiveClass={inactiveClass}
              linkClass={linkClass}
            />
          </div>
        </nav>

        {/* Footer with Logout */}
        <div className={`p-6 space-y-3 transition-all ${isCollapsed ? "opacity-0 scale-95" : "opacity-100"}`}>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full gap-2 rounded-lg px-4 py-3 text-sm font-medium text-rose-300 hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter mb-1">
              Institutional Motto
            </p>
            <p className="text-[11px] text-[#c2a336] font-bold italic whitespace-nowrap">
              "Justice be our Shield"
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

/* Sidebar Link Component */
const SidebarLink = ({
  to,
  icon,
  label,
  isCollapsed,
  activeClass,
  inactiveClass,
  linkClass,
}: any) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `${linkClass} ${isActive ? activeClass : inactiveClass} ${
        isCollapsed ? "justify-center px-0" : ""
      }`
    }
  >
    <div className="flex items-center gap-3">
      <span className="shrink-0 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </span>
      {!isCollapsed && <span className="animate-in fade-in duration-300">{label}</span>}
    </div>
    {!isCollapsed && (
      <ChevronRight
        size={14}
        className="opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0"
      />
    )}
  </NavLink>
);

export default AdminSidebar;
