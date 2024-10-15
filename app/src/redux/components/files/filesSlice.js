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
    },
    lockFileLocal(state, action) {
      const fileIndex = state.list.findIndex(f => f.path === action.payload.filePath);
      if (fileIndex === -1) {
        return;
      }
      state.list = [
        ...state.list.slice(0, fileIndex),
        {
          ...state.list[fileIndex],
          lock: action.payload.lock,
        },
        ...state.list.slice(fileIndex + 1)
      ];
    },
    unlockFileLocal(state, action) {
      const fileIndex = state.list.findIndex(f => f.path === action.payload);
      if (fileIndex === -1) {
        return;
      }

      if (state.list[fileIndex].isMissing) {
        state.list = [
          ...state.list.slice(0, fileIndex),
          ...state.list.slice(fileIndex + 1)
        ];
      } else {
        state.list = [
          ...state.list.slice(0, fileIndex),
          {
            ...state.list[fileIndex],
            lock: undefined,
          },
          ...state.list.slice(fileIndex + 1)
        ];
      }
    }
  }
});

// Export actions
export const { setFiles, startFetching, stopFetching, lockFileLocal, unlockFileLocal } = filesSlice.actions;

// Export reducer
export default filesSlice.reducer;
