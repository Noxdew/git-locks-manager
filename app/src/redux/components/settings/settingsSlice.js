import { createSlice } from "@reduxjs/toolkit";

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    selectorOpen: false,
  },
  reducers: {
    toggle(state, action) {
      state.selectorOpen = !state.selectorOpen;
    }
  }
});

// Export actions
export const { toggle } = settingsSlice.actions;

// Export reducer
export default settingsSlice.reducer;
