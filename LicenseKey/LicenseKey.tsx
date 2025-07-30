import { useEffect, useState } from 'react';
import './LicenseKey.css'; // We'll create this CSS next

declare global {
  interface Window {
    electronAPI?: {
      sendLog?: (...args: any[]) => void;
      getMachineId?: () => Promise<string>;
    };
  }
}

// Override console.log to forward logs to Electron main process
const originalConsoleLog = console.log;
console.log = (...args: unknown[]) => {
  if (window.electronAPI?.sendLog) {
    window.electronAPI.sendLog(...args);
  }
  originalConsoleLog(...args);
};

export default function LicenseKey() {
  const [count, setCount] = useState<number>(0);
  const [machineId, setMachineId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (window.electronAPI?.getMachineId) {
      console.log('electronAPI object exists');
      console.log('electronAPI.getMachineId is', typeof window.electronAPI.getMachineId);

      window.electronAPI.getMachineId()
        .then((id: string) => {
          setMachineId(id);
        })
        .catch(() => {
          setError('Failed to get Machine ID');
        });
    } else {
      setError('electronAPI.getMachineId not available');
    }
  }, []);

  return (
    <div className="license-container">
      <h2 className="license-title">License Key</h2>
      <div className="license-box">
        <p className="machine-id">
          Machine ID: <code>{machineId || error || 'Loading...'}</code>
        </p>
        <button className="increment-btn" onClick={() => setCount((c) => c + 1)}>
          Count is {count}
        </button>
      </div>
    </div>
  );
}
