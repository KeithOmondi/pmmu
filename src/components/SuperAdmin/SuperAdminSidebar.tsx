import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  UserCog,
  Settings,
  Gavel,
  LogOut,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { useAppDispatch } from "../../store/hooks"; // adjust path
import { logout } from "../../store/slices/authSlice";

const SuperAdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Dynamic Layout Constants
  const sidebarWidth = isCollapsed ? "w-20" : "w-64";

  const linkClass =
    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group text-sm font-medium relative";

  const activeClass = "bg-white/10 text-[#c2a336] shadow-sm ring-1 ring-white/20";
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
    <aside
      className={`sticky top-0 h-screen ${sidebarWidth} bg-[#1a3a32] text-white flex flex-col shadow-2xl transition-all duration-500 ease-in-out shrink-0 z-50`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-12 w-6 h-6 bg-[#c2a336] rounded-full flex items-center justify-center text-[#1a3a32] shadow-xl hover:scale-110 transition-transform active:scale-90 z-[60]"
      >
        {isCollapsed ? <Menu size={12} /> : <ChevronLeft size={14} />}
      </button>

      {/* Branding Section */}
      <div
        className={`p-6 flex flex-col items-center border-b border-white/10 transition-all duration-300 ${
          isCollapsed ? "pt-8" : ""
        }`}
      >
        <div
          className={`bg-[#c2a336] rounded-full flex items-center justify-center shadow-lg ring-4 ring-[#c2a336]/20 transition-all duration-500 ${
            isCollapsed ? "w-10 h-10 mb-0 rotate-0" : "w-12 h-12 mb-4 rotate-[360deg]"
          }`}
        >
          <Gavel className="text-[#1a3a32] w-6 h-6" />
        </div>

        {!isCollapsed && (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-sm font-bold tracking-[0.2em] uppercase whitespace-nowrap">
              Super Admin
            </h2>
            <span className="text-[10px] text-[#8c94a4] font-semibold mt-1 uppercase tracking-wider block">
              ORHC Panel
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 overflow-y-auto overflow-x-hidden p-4 mt-4 space-y-1 custom-scrollbar`}
      >
        <NavItem
          to="/superadmin/dashboard"
          icon={<LayoutDashboard size={18} />}
          label="Dashboard"
          isCollapsed={isCollapsed}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
          linkClass={linkClass}
        />
        <NavItem
          to="/superadmin/indicators"
          icon={<ClipboardList size={18} />}
          label="Indicators"
          isCollapsed={isCollapsed}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
          linkClass={linkClass}
        />
        <NavItem
          to="/superadmin/approved"
          icon={<ClipboardList size={18} />}
          label="All Approved"
          isCollapsed={isCollapsed}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
          linkClass={linkClass}
        />
        <NavItem
          to="/superadmin/users"
          icon={<Users size={18} />}
          label="System Users"
          isCollapsed={isCollapsed}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
          linkClass={linkClass}
        />
        <NavItem
          to="/superadmin/admins"
          icon={<UserCog size={18} />}
          label="Admin Staff"
          isCollapsed={isCollapsed}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
          linkClass={linkClass}
        />

        <div
          className={`transition-all duration-300 flex justify-center ${
            isCollapsed ? "py-4" : "pt-6 pb-2 px-4"
          }`}
        >
          <p
            className={`text-[10px] font-bold text-[#8c94a4] uppercase tracking-widest border-b border-white/5 pb-2 w-full transition-opacity ${
              isCollapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"
            }`}
          >
            Configuration
          </p>
          {isCollapsed && <div className="w-8 h-[1px] bg-white/10" />}
        </div>

        <NavItem
          to="/superadmin/settings"
          icon={<Settings size={18} />}
          label="System Settings"
          isCollapsed={isCollapsed}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
          linkClass={linkClass}
        />
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t border-white/10 space-y-2 transition-all duration-300`}>
        <button
          onClick={handleLogout}
          className={`flex items-center rounded-lg transition-colors group text-sm font-medium text-rose-300 hover:bg-rose-500/10 ${
            isCollapsed ? "w-full justify-center p-3" : "w-full px-4 py-3 gap-3"
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span className="animate-in slide-in-from-left-2">Sign Out</span>}
        </button>

        <div
          className={`bg-[#c2a336]/10 rounded-xl border border-[#c2a336]/20 transition-all duration-300 ${
            isCollapsed ? "h-0 opacity-0 overflow-hidden p-0" : "p-3 opacity-100"
          }`}
        >
          <p className="text-[10px] text-[#c2a336] font-bold uppercase text-center leading-tight tracking-tighter whitespace-nowrap">
            Justice & Integrity
          </p>
        </div>
      </div>
    </aside>
  );
};

const NavItem = ({
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
      `${linkClass} ${isActive ? activeClass : inactiveClass} ${isCollapsed ? "justify-center px-0" : ""}`
    }
  >
    <span className="transition-transform group-hover:scale-110 group-active:scale-95 shrink-0">
      {icon}
    </span>
    {!isCollapsed && (
      <span className="animate-in slide-in-from-left-2 duration-300 whitespace-nowrap overflow-hidden">
        {label}
      </span>
    )}

    {/* Tooltip for Collapsed Mode */}
    {isCollapsed && (
      <div className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] shadow-xl">
        {label}
      </div>
    )}
  </NavLink>
);

export default SuperAdminSidebar;
