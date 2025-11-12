import { useState } from "react";
import {
  LayoutDashboard,
  Monitor,
  MonitorPlay,
  CalendarDays,
  User,
  LifeBuoy,
  Menu,
  X,
  UploadCloudIcon,
  LogOut,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUser, logout as forceLocalLogout } from "../Redux/Authentications/AuthSlice";

type NavItem =
  | { label: "Dashboard" | "Media Content" | "Media" | "Schedule" | "Screen Management" | "Account" | "Support"; icon: any; path: string }
  | { label: "Logout"; icon: any; action: "logout" };

const menuItems: NavItem[] = [
  { label: "Dashboard",         icon: LayoutDashboard, path: "/dashboard" },
  { label: "Media Content",     icon: MonitorPlay,     path: "/mediacontent" },
  { label: "Media",             icon: UploadCloudIcon, path: "/mediaupload" },
  { label: "Schedule",          icon: CalendarDays,    path: "/schedule" },
  { label: "Screen Management", icon: Monitor,         path: "/screenmanagement" },
  { label: "Account",           icon: User,            path: "/profile" },
  { label: "Support",           icon: LifeBuoy,        path: "/support" },
  { label: "Logout",            icon: LogOut,          action: "logout" },
];

const ToolBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const dispatch = useDispatch();

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  // Simple alert/confirm before logging out
  const startLogoutFlow = async () => {
    const ok = window.confirm("Are you sure you want to log out?");
    if (!ok) return;

    try {
      // @ts-ignore unwrap available if you use RTK types; ignore if not
      await dispatch(logoutUser()).unwrap();
    } catch {
      // Force local cleanup even if server logout fails
      dispatch(forceLocalLogout());
    } finally {
      setIsOpen(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded shadow"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-70 bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static`}
      >
        <div className="p-6 flex flex-col h-full">
          <h1 className="text-2xl font-bold text-[var(--mainred)] mb-6">
            Admin Dashboard
          </h1>

          <nav className="flex flex-col gap-5 overflow-y-auto flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                "path" in item ? currentPath.startsWith(item.path) : false;

              const className = `flex items-center gap-3 px-4 py-2 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-[var(--mainred)] text-white"
                  : "text-black hover:bg-[var(--mainred)] hover:text-white"
              }`;

              return (
                <button
                  key={"path" in item ? item.path : item.label}
                  onClick={
                    "action" in item && item.action === "logout"
                      ? startLogoutFlow
                      : () => handleNavClick((item as Extract<NavItem, { path: string }>).path)
                  }
                  className={className}
                >
                  <Icon size={20} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-6 text-sm text-gray-500">v1.0.0</div>
        </div>
      </aside>
    </>
  );
};

export default ToolBar;
