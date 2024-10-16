import { createSlice } from "@reduxjs/toolkit";

const filesSlice = createSlice({
  name: "files",
  initialState: {
    list: [],
    lastUpdated: undefined,
    fetching: false,
    selectedFiles: [],
  },
  reducers: {
    setFiles(state, action) {
      state.list = action.payload;
      state.lastUpdated = Date.now();
      state.fetching = false;
      state.selectedFiles = state.selectedFiles.filter(f => state.list.find(lf => lf.path === f));
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
    },
    toggleSelectedFile(state, action) {
      const fileIndex = state.selectedFiles.findIndex(f => f === action.payload);
      if (fileIndex === -1) {
        state.selectedFiles.push(action.payload);
      } else {
        state.selectedFiles = [
          ...state.selectedFiles.slice(0, fileIndex),
          ...state.selectedFiles.slice(fileIndex + 1)
        ];
      }
    },
    clearSelectedFiles(state) {
      state.selectedFiles = [];
    }
  }
});

// Export actions
export const { setFiles, startFetching, stopFetching, lockFileLocal, unlockFileLocal, toggleSelectedFile, clearSelectedFiles } = filesSlice.actions;

// Export reducer
export default filesSlice.reducer;
