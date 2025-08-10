import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import ToolBar from "./layout/Tabbar";
import MediaContent from "./Screens/MediaContent/MediaContent";
import PlayList from "./Screens/Playlist/Normal/PlayList";
// import CreateInteractivePlaylist from "./Components/InteractivePlaylist/InteractivePlaylist";
import LoginScreen from "./Screens/AuthScreens/LoginScreen";
import LicenseKey from "./../LicenseKey/LicenseKey";
import Test from "./Screens/Test";
import ScreenManagement from "./Screens/ScreenManagement/ScreenManagement";

function AppWrapper() {
  const location = useLocation();

  // Pages where ToolBar should NOT be shown
  const hideToolbarPaths = ["/login", "/license", "/playlist"];

  const shouldHideToolbar = hideToolbarPaths.includes(location.pathname);

  return (
    <div className="flex">
      {/* Conditionally render ToolBar */}
      {!shouldHideToolbar && <ToolBar />}

      <div className="flex-1 bg-[var(--white-200)] p-4 w-full">
        <Routes>
          <Route path="/mediacontent" element={<MediaContent />} />
          <Route path="/playlist" element={<PlayList />} />
          <Route path="/screenmanagement" element={<ScreenManagement />} />
          {/* <Route path="/interactive" element={<CreateInteractivePlaylist />} /> */}
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/license" element={<LicenseKey />} />
          <Route path="/test" element={<Test />} />
        </Routes>
      </div>
    </div>
  );
}

// Wrap AppWrapper in Router
function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
