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
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Media Content", icon: MonitorPlay, path: "/mediacontent" },
  { label: "Media", icon: UploadCloudIcon, path: "/mediaupload" },
  { label: "Schedule", icon: CalendarDays, path: "/schedule" },
  { label: "Screen Management", icon: Monitor, path: "/screenmanagement" },
  { label: "Account", icon: User, path: "/profile" },
  { label: "Support", icon: LifeBuoy, path: "/support" },
];

const ToolBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
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

          <nav className="flex flex-col gap-5 overflow-y-auto flex-1 ">
            {menuItems.map(({ label, icon: Icon, path }) => {
              const isActive = currentPath.startsWith(path);
              return (
                <button
                  key={path}
                  onClick={() => handleNavClick(path)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-[var(--mainred)] text-white"
                      : "text-black hover:bg-[var(--mainred)] hover:text-white"
                  }`}
                >
                  <Icon size={20} />
                  <span className="whitespace-nowrap">{label}</span>
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
