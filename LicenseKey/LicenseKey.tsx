import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setMachineId } from '../src/Redux/Machine/machineSlice';

declare global {
  interface Window {
    electronAPI?: {
      sendLog?: (...args: any[]) => void;
      getMachineId?: () => Promise<string>;
    };
  }
}

// Optional: Forward console logs to Electron
const originalConsoleLog = console.log;
console.log = (...args: unknown[]) => {
  if (window.electronAPI?.sendLog) {
    window.electronAPI.sendLog(...args);
  }
  originalConsoleLog(...args);
};

export default function LicenseKey() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (window.electronAPI?.getMachineId) {
      window.electronAPI.getMachineId()
        .then((id: string) => {
          dispatch(setMachineId(id));
        })
        .catch(() => {
          console.error('Failed to get Machine ID');
        });
    } else {
      console.error('electronAPI.getMachineId not available');
    }
  }, [dispatch]);

  return null; // Render nothing to the UI
}
