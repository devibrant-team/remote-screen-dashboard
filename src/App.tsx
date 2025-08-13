

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import ToolBar from "./layout/Tabbar";
import MediaContent from "./Screens/MediaContent/MediaContent";
import PlayList from "./Screens/Playlist/Normal/PlayList";
import LoginScreen from "./Screens/AuthScreens/LoginScreen";
import LicenseKey from "./../LicenseKey/LicenseKey";
import Test from "./Screens/Test";
import ScreenManagement from "./Screens/ScreenManagement/ScreenManagement";

function AppWrapper() {
  const location = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const hideToolbarPaths = ["/login", "/license", "/playlist"];
  const shouldHideToolbar = hideToolbarPaths.includes(location.pathname);

  return (
    <div className="flex">
      {!shouldHideToolbar && <ToolBar />}
      <LicenseKey />

      
        <Routes>
          {/* Public routes (redirect to mediacontent if already logged in) */}
          <Route
            path="/"
            element={token ? <Navigate to="/mediacontent" replace /> : <LoginScreen />}
          />
          <Route
            path="/login"
            element={token ? <Navigate to="/mediacontent" replace /> : <LoginScreen />}
          />

          {/* Protected routes (redirect to login if not logged in) */}
          <Route
            path="/mediacontent"
            element={token ? <MediaContent /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/playlist"
            element={token ? <PlayList /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/screenmanagement"
            element={token ? <ScreenManagement /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/test"
            element={token ? <Test /> : <Navigate to="/login" replace />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={token ? "/mediacontent" : "/login"} replace />} />
        </Routes>
    
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
