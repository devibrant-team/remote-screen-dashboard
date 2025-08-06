import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ToolBar from './layout/Tabbar';
import MediaContent from './Screens/MediaContent/MediaContent';
import PlayList from './Screens/Playlist/Normal/PlayList';
import CreateInteractivePlaylist from './Components/InteractivePlaylist/InteractivePlaylist';
import LoginScreen from './Screens/AuthScreens/LoginScreen';
import LicenseKey from './../LicenseKey/LicenseKey';
import Test from './Screens/Test';

function App() {
  return (
    <Router>
      <div className="flex">
        {/* Sidebar always visible */}
        <ToolBar />

        {/* Main content area */}
        <div className="flex-1 bg-[var(--white-200)]  p-4 w-full">
          <Routes>
            <Route path="/mediacontent" element={<MediaContent />} />
            <Route path="/playlist" element={<PlayList />} />
            <Route path="/interactive" element={<CreateInteractivePlaylist />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/license" element={<LicenseKey />} />
            <Route path="/test" element={<Test />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
