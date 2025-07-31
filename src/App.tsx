import './App.css';
import LicenseKey from './../LicenseKey/LicenseKey';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import LoginScreen from './Screens/AuthScreens/LoginScreen';

function App() {
  const machineId: string | null = useSelector((state: RootState) => state.machine.machineId);

  return (
    <>
      <LicenseKey />
     <LoginScreen/>
    </>
  );
}

export default App;
