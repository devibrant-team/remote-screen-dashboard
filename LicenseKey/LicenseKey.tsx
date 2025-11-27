// LicenseKey/LicenseKey.tsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setMachineId } from '../src/Redux/Machine/machineSlice';
import type { RootState } from 'store';


export default function LicenseKey() {
  const dispatch = useDispatch();


  // Optional console forwarding (guarded)
  const originalConsoleLog = console.log;
  // @ts-ignore
  console.log = (...args: unknown[]) => {
    try { window.electronAPI?.sendLog?.(...(args as any[])); } catch {}
    originalConsoleLog(...args);
  };

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.getMachineId) {
      console.warn('electronAPI.getMachineId not available (dev web or preload failed).');
      return;
    }
    api.getMachineId()
      .then((id: string) => dispatch(setMachineId(id)))
      .catch((err) => console.error('Failed to get Machine ID', err));
  }, [dispatch]);

  return null;
}
