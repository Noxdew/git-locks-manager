import { createSlice } from "@reduxjs/toolkit";

const reposSlice = createSlice({
  name: "repos",
  initialState: {
    selectorOpen: false,
    list: window.api.store.initial()['repos'] || [],
  },
  reducers: {
    toggle(state, action) {
      state.selectorOpen = !state.selectorOpen;
    },
    addRepo(state, action) {
      state.list.push(action.payload);
    },
    removeRepo(state, action) {
      state.list = state.list.filter(r => r.id !== action.payload);
    },
    setRepos(state, action) {
      state.list = action.payload;
    }
  }
});

// Export actions
export const { toggle, addRepo, removeRepo, setRepos } = reposSlice.actions;

// Export reducer
export default reposSlice.reducer;
