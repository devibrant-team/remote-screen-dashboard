
// import LicenseKey from './../LicenseKey/LicenseKey';
// import { useSelector } from 'react-redux';
// import type { RootState } from '../store';
// import LoginScreen from './Screens/AuthScreens/LoginScreen';
// import PlayList from './Screens/Playlist/Normal/PlayList';

// function App() {
//   const machineId: string | null = useSelector((state: RootState) => state.machine.machineId);

//   return (
//     <>
//       {/* <LicenseKey />
//      <LoginScreen/> */}
//      <PlayList/>
//     </>
//   );
// }

// export default App;
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import LicenseKey from './../LicenseKey/LicenseKey';
import LoginScreen from './Screens/AuthScreens/LoginScreen';
import PlayList from './Screens/Playlist/Normal/PlayList';
import Test from './Screens/Test';
import CreateInteractivePlaylist from './Components/InteractivePlaylist/InteractivePlaylist';

function App() {
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CreateInteractivePlaylist />} />
        <Route path="/playlist" element={<PlayList />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;
