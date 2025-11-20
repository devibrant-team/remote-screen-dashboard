import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface MachineState {
  machineId: string | null;
}

const initialState: MachineState = {
  machineId: null,
};

export const machineSlice = createSlice({
  name: 'machine',
  initialState,
  reducers: {
    setMachineId: (state, action: PayloadAction<string>) => {
      state.machineId = action.payload;
    },
  },
});

export const { setMachineId } = machineSlice.actions;
export default machineSlice.reducer;
