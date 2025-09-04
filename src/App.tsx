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
import Schedule from "./Screens/Schedule/Schedule";
import Media from "./Screens/UploadMedia/Media";


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
    <div className="flex">
      <ToolBar />
      {/* LicenseKey only where you need it; move it here if appropriate */}
      <div className="flex-1">
        <Outlet />
      </div>
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
              <Route path="/schedule" element={<Schedule />} />
            </Route>
          </Route>

          {/* Protected routes WITH Tabbar */}
          <Route element={<RequireAuth />}>
            <Route element={<AppLayoutWithTabbar />}>
              <Route path="/mediacontent" element={<MediaContent />} />
              <Route path="/screenmanagement" element={<ScreenManagement />} />
              <Route path="/mediaupload" element={<Media />} />
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
