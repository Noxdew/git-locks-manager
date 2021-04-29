import { createSlice } from "@reduxjs/toolkit";

const filesSlice = createSlice({
  name: "files",
  initialState: {
    list: [],
    lastUpdated: undefined,
    fetching: false,
  },
  reducers: {
    setFiles(state, action) {
      state.list = action.payload;
      state.lastUpdated = Date.now();
      state.fetching = false;
    },
    startFetching(state) {
      state.fetching = true;
    },
    stopFetching(state) {
      state.fetching = false;
    }
  }
});

// Export actions
export const { setFiles, startFetching, stopFetching } = filesSlice.actions;

// Export reducer
export default filesSlice.reducer;
