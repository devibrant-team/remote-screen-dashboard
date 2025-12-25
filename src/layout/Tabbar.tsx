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
  Building2Icon,
  LogOut,
  Loader2, // ✅ add
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  logoutUser,
  logout as forceLocalLogout,
} from "../Redux/Authentications/AuthSlice";
import { useConfirmDialog } from "@/Components/ConfirmDialogContext";

type NavItem =
  | {
      label:
        | "Dashboard"
        | "Playlist"
        | "Branches"
        | "Library"
        | "Schedule"
        | "Screen Management"
        | "Account"
        | "Support";
      icon: any;
      path: string;
    }
  | { label: "Logout"; icon: any; action: "logout" };

const menuItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Branches", icon: Building2Icon, path: "/branches" },
  { label: "Playlist", icon: MonitorPlay, path: "/mediacontent" },
  { label: "Library", icon: UploadCloudIcon, path: "/mediaupload" },
  { label: "Schedule", icon: CalendarDays, path: "/schedule" },
  { label: "Screen Management", icon: Monitor, path: "/screenmanagement" },
  { label: "Account", icon: User, path: "/profile" },
  { label: "Support", icon: LifeBuoy, path: "/support" },
  { label: "Logout", icon: LogOut, action: "logout" },
];

const ToolBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // ✅ add
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const dispatch = useDispatch();
  const confirm = useConfirmDialog();

  const handleNavClick = (path: string) => {
    if (isLoggingOut) return; // ✅ block navigation while logging out
    navigate(path);
    setIsOpen(false);
  };

  const startLogoutFlow = async () => {
    if (isLoggingOut) return; // ✅ prevent double click

    const ok = await confirm({
      title: "Log out",
      message: "Are you sure you want to log out?",
      confirmText: "Log out",
      cancelText: "Cancel",
    });

    if (!ok) return;

    setIsLoggingOut(true);

    try {
      // @ts-ignore
      await dispatch(logoutUser()).unwrap();
    } catch {
      // ignore server error
    } finally {
      dispatch(forceLocalLogout());
      setIsOpen(false);

      // ✅ Hard redirect (fresh state)
      window.location.replace("/login");
      // no need to setIsLoggingOut(false) because page will reload
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded shadow"
        onClick={() => !isLoggingOut && setIsOpen(!isOpen)} // ✅ block while logging out
        aria-label="Toggle sidebar"
        disabled={isLoggingOut}
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
              const isLogout = "action" in item && item.action === "logout";
              const Icon = isLogout
                ? isLoggingOut
                  ? Loader2
                  : item.icon
                : item.icon;

              const isActive =
                "path" in item ? currentPath.startsWith(item.path) : false;

              const className = `flex items-center gap-3 px-4 py-2 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-[var(--mainred)] text-white"
                  : "text-black hover:bg-[var(--mainred)] hover:text-white"
              } ${isLoggingOut ? "opacity-60 cursor-not-allowed" : ""}`;

              return (
                <button
                  key={"path" in item ? item.path : item.label}
                  disabled={isLoggingOut} // ✅ disables all buttons while logout
                  onClick={
                    isLogout
                      ? startLogoutFlow
                      : () =>
                          handleNavClick(
                            (item as Extract<NavItem, { path: string }>).path
                          )
                  }
                  className={className}
                >
                  <Icon size={20} className={isLogout && isLoggingOut ? "animate-spin" : ""} />
                  <span className="whitespace-nowrap">
                    {isLogout && isLoggingOut ? "Logging out..." : item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="pt-6 text-sm text-gray-500">v0.0.3</div>
        </div>
      </aside>
    </>
  );
};

export default ToolBar;
