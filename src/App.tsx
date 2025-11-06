import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import ToolBar from "./layout/Tabbar";
import MediaContent from "./Screens/MediaContent/MediaContent";
import PlayList from "./Screens/Playlist/Normal/PlayList";
import LoginScreen from "./Screens/AuthScreens/LoginScreen";
import LicenseKey from "./../LicenseKey/LicenseKey";
import ScreenManagement from "./Screens/ScreenManagement/ScreenManagement";

import Media from "./Screens/UploadMedia/Media";
import ScheduleItem from "./Screens/Schedule/ScheduleItem/ScheduleItem";
import Schedule from "./Screens/Schedule/Schedule";
import NewCalender from "./Screens/Schedule/Calender/NewCalender/NewCalender";
import New from "./Screens/Schedule/Calender/NewCalender/New";
import AccountSettingsDashboard from "./Screens/Profile/AccountSettingsDashboard";

/* ---------- Auth gate ---------- */
function RequireAuth() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

/* ---------- Layouts ---------- */
// Shown on authenticated pages that should have the Tabbar
function AppLayoutWithTabbar() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="h-screen sticky top-0">
        <ToolBar />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

// Shown on pages (public or protected) that should NOT have the Tabbar
function PlainLayout() {
  return (
    <div className="flex">
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}

/* ---------- Routes ---------- */
export default function App() {
  return (
    <>
      <LicenseKey />
      <Router>
        <Routes>
          {/* Public routes (no Tabbar) */}
          <Route element={<PlainLayout />}>
            <Route path="/login" element={<LoginScreen />} />
            {/* If you have a license screen that should be public without Tabbar: */}
            <Route path="/license" element={<LicenseKey />} />
            {/* Root: if logged in, go to app; else go to login */}
            <Route path="/" element={<AuthRedirect />} />
          </Route>

          {/* Protected routes WITHOUT Tabbar */}
          <Route element={<RequireAuth />}>
            <Route element={<PlainLayout />}>
              <Route path="/playlist" element={<PlayList />} />
              <Route path="/calender" element={<Schedule />} />
              <Route path="/newcalender" element={<New />} />
            </Route>
          </Route>

          {/* Protected routes WITH Tabbar */}
          <Route element={<RequireAuth />}>
            <Route element={<AppLayoutWithTabbar />}>
              <Route path="/mediacontent" element={<MediaContent />} />
              <Route path="/screenmanagement" element={<ScreenManagement />} />
              <Route path="/mediaupload" element={<Media />} />
              <Route path="/schedule" element={<ScheduleItem />} />
              <Route path="/profile" element={<AccountSettingsDashboard />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

/* ---------- Helper ---------- */
function AuthRedirect() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? (
    <Navigate to="/mediacontent" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}
