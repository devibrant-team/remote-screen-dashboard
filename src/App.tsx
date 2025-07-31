import './App.css';
import LicenseKey from './../LicenseKey/LicenseKey';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

function App() {
  const machineId: string | null = useSelector((state: RootState) => state.machine.machineId);

  return (
    <>
      <LicenseKey />
      <div className="app-container">
        <h2>
          {machineId ? 'Machine ID (for testing):' : 'Machine ID else (for testing):'}
        </h2>
        <code>{machineId ?? 'Loading or unavailable'}</code>
      </div>
    </>
  );
}

export default App;
