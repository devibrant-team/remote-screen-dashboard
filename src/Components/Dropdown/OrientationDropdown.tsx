import { setScreenType } from '@/Redux/ScreenManagement/ScreenManagementSlice';
import { ChevronDown } from 'lucide-react';
import React, { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from 'store';

const OrientationDropdown = () => {
const dispatch = useDispatch();
  const selectedtype = useSelector((s: RootState) => s.screenManagement.Selectedtype);

const value = useMemo(
    () => (selectedtype == null ? "" : selectedtype),
    [selectedtype]
  );
const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const v = e.target.value;
  

  dispatch(setScreenType(v));


};

  return (
    <div className="relative w-full sm:w-auto">
        <select
          value={value}
          onChange={onChange}
       
          className="w-full appearance-none rounded-lg border border-neutral-300 bg-white py-2 pl-3 pr-9 text-sm font-medium text-neutral-800 shadow-sm outline-none transition focus:border-neutral-400 disabled:opacity-50"
        >
          {/* Default = Unassigned */}
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
         
        </select>
  
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
        />
      </div>
  )
}

export default OrientationDropdown