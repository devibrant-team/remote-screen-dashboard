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

import New from "./Screens/Schedule/Calender/NewCalender/New";
import AccountSettingsDashboard from "./Screens/Profile/AccountSettingsDashboard";
import Dashboard from "./Screens/Dashboard/Dashboard";
import Support from "./Screens/Support/Support";
import BranchScreen from "./Screens/Branches/BranchScreen";
import ConnectionStatusBanner from "./Components/ConnectionStatusBanner";
import { useGetVersion } from "./ReactQuery/Version/GetVersion";
import { APP_VERSION } from "./Hook/version";
import { useEffect, useState } from "react";
import { useAlertDialog } from "./AlertDialogContext";
import { useConfirmDialog } from "./Components/ConfirmDialogContext";
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
  const { data: backendVersion, isLoading } = useGetVersion();
  // console.log(backendVersion)
  const alert = useAlertDialog();
  const confirm = useConfirmDialog();

  const [updateHandled, setUpdateHandled] = useState(false);

useEffect(() => {
  if (isLoading || !backendVersion || updateHandled) return;

  const serverVersion = backendVersion.version;
  const type = backendVersion.versionType; // 1 = forced, 0 = optional
  const downloadUrl = backendVersion.link;

  // If versions are the same → no dialog
  if (!serverVersion || serverVersion === APP_VERSION) return;

  setUpdateHandled(true); // avoid showing multiple times

const startDownload = async () => {
  console.log("[Update] backendVersion:", backendVersion);
  console.log("[Update] downloadUrl:", downloadUrl);

  if (!downloadUrl) {
    await alert({
      title: "Download unavailable",
      message:
        "A new version is available, but no download link was provided. Please contact support.",
      buttonText: "OK",
    });
    return;
  }

  // ✅ If inside Electron, open Chrome/default browser
  if (window.electronAPI?.openExternal) {
    console.log("[Update] Opening in default browser:", downloadUrl);
    window.electronAPI.openExternal(downloadUrl);
    return;
  }

  // ✅ If not Electron, normal browser behavior
  window.open(downloadUrl, "_blank");
};



  // FORCED UPDATE (versionType === 1)
  if (type === 1) {
    (async () => {
      await alert({
        title: "Update required",
        message: `A new version (${serverVersion}) of Iguana Dashboard is available.\n\nYour current version is ${APP_VERSION}.\n\nYou must update to continue using the app.`,
        buttonText: "Update now",
      });

      await startDownload();
    })();
  } else {
    // OPTIONAL UPDATE (versionType !== 1)
    (async () => {
      const ok = await confirm({
        title: "Update available",
        message: `A new version (${serverVersion}) of Iguana Dashboard is available.\n\nYour current version is ${APP_VERSION}.\n\nDo you want to download it now?`,
        confirmText: "Download",
        cancelText: "Later",
      });

      if (ok) {
        await startDownload();
      }
    })();
  }
}, [backendVersion, isLoading, updateHandled, alert, confirm]);

  return (
    <>
      <LicenseKey />
      <ConnectionStatusBanner />
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
              <Route path="/branches" element={<BranchScreen />} />
              <Route path="/mediacontent" element={<MediaContent />} />
              <Route path="/screenmanagement" element={<ScreenManagement />} />
              <Route path="/mediaupload" element={<Media />} />
              <Route path="/schedule" element={<ScheduleItem />} />
              <Route path="/profile" element={<AccountSettingsDashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/support" element={<Support />} />
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
