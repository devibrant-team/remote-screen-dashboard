
import LicenseKey from './../LicenseKey/LicenseKey';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import LoginScreen from './Screens/AuthScreens/LoginScreen';
import PlayList from './Screens/Playlist/Normal/PlayList';

function App() {
  const machineId: string | null = useSelector((state: RootState) => state.machine.machineId);

  return (
    <>
      {/* <LicenseKey />
     <LoginScreen/> */}
     <PlayList/>
    </>
  );
}

export default App;
