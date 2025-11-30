// LicenseKey/LicenseKey.tsx
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setMachineId } from '../src/Redux/Machine/machineSlice';


export default function LicenseKey() {
  const dispatch = useDispatch();




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
