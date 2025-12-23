import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  UserCircle,
  Settings,
  Scale,
  ChevronRight,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { useAppDispatch } from "../../store/hooks"; // adjust path
import { logout } from "../../store/slices/authSlice";

const UserSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const sidebarWidth = isCollapsed ? "w-20" : "w-72";

  const linkClass =
    "group flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 text-sm font-bold tracking-tight mb-2";

  const inactiveClass =
    "text-white/60 hover:text-white hover:bg-white/5 border border-transparent";

  const activeClass =
    "bg-[#c2a336] text-[#1a3a32] shadow-lg shadow-[#c2a336]/20 border border-[#d4b54d]";

  // Logout handler
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(logout()).unwrap();
      // Navigate to login page on successful logout
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
      // Even if the API call fails, clear local state and redirect
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      className={`sticky top-0 h-screen ${sidebarWidth} bg-[#1a3a32] text-white p-4 flex flex-col border-r border-white/5 shadow-2xl shrink-0 transition-all duration-500 ease-in-out`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 w-6 h-6 bg-[#c2a336] rounded-full flex items-center justify-center text-[#1a3a32] shadow-lg z-50 hover:scale-110 transition-transform"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Branding Header */}
      <div className="flex flex-col items-center mb-10 shrink-0 overflow-hidden">
        <div
          className={`bg-[#c2a336] rounded-2xl flex items-center justify-center text-[#1a3a32] shadow-xl transition-all duration-500 ${
            isCollapsed
              ? "w-10 h-10 mb-0"
              : "w-14 h-14 mb-4 transform -rotate-3"
          }`}
        >
          <Scale size={isCollapsed ? 20 : 32} />
        </div>

        {!isCollapsed && (
          <div className="text-center animate-in fade-in duration-500">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#c2a336] whitespace-nowrap">
              Judiciary Registry
            </h2>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1 whitespace-nowrap">
              Personnel Division
            </p>
          </div>
        )}
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
        {!isCollapsed && (
          <p className="px-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">
            Main Menu
          </p>
        )}

        <SidebarLink
          to="/user/dashboard"
          icon={<LayoutDashboard size={18} />}
          label="Executive Desk"
          isCollapsed={isCollapsed}
          baseClass={linkClass}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
        />
        <SidebarLink
          to="/user/indicators"
          icon={<Target size={18} />}
          label="Performance"
          isCollapsed={isCollapsed}
          baseClass={linkClass}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
        />
        <SidebarLink
          to="/user/profile"
          icon={<UserCircle size={18} />}
          label="Personnel Profile"
          isCollapsed={isCollapsed}
          baseClass={linkClass}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
        />
        <SidebarLink
          to="/user/reports"
          icon={<Settings size={18} />}
          label="Reports"
          isCollapsed={isCollapsed}
          baseClass={linkClass}
          activeClass={activeClass}
          inactiveClass={inactiveClass}
        />
      </nav>

      {/* Footer / Logout */}
      <div className="mt-auto pt-6 border-t border-white/5 shrink-0 space-y-3">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`flex items-center justify-center w-full gap-2 rounded-lg px-4 py-3 text-sm font-medium text-rose-300 hover:bg-rose-500/10 transition-all ${
            isLoggingOut ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          <LogOut size={18} className={isLoggingOut ? "animate-pulse" : ""} />
          {!isCollapsed && (
            <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
          )}
        </button>

        <div
          className={`bg-white/5 rounded-2xl flex items-center transition-all duration-300 ${
            isCollapsed ? "p-2 justify-center" : "p-4 gap-3"
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          {!isCollapsed && (
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 whitespace-nowrap">
              System Encrypted
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};

/* --- Sidebar Link Component --- */
interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  baseClass: string;
  activeClass: string;
  inactiveClass: string;
}

const SidebarLink = ({
  to,
  icon,
  label,
  isCollapsed,
  baseClass,
  activeClass,
  inactiveClass,
}: SidebarLinkProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `${baseClass} ${isActive ? activeClass : inactiveClass} ${
        isCollapsed ? "justify-center px-0" : "justify-between"
      }`
    }
  >
    {({ isActive }) => (
      <>
        <div className="flex items-center gap-3">
          <span
            className={`${
              isActive ? "text-[#1a3a32]" : "text-[#c2a336]"
            } shrink-0`}
          >
            {icon}
          </span>
          {!isCollapsed && (
            <span className="whitespace-nowrap animate-in slide-in-from-left-2 duration-300">
              {label}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <ChevronRight
            size={14}
            className={`transition-transform duration-300 ${
              isActive
                ? "rotate-90 opacity-100"
                : "opacity-0 group-hover:opacity-40"
            }`}
          />
        )}
      </>
    )}
  </NavLink>
);

export default UserSidebar;