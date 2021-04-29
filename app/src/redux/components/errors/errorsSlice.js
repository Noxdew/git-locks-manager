import { createSlice } from "@reduxjs/toolkit";

const errorsSlice = createSlice({
  name: "errors",
  initialState: {
    list: [],
  },
  reducers: {
    addError(state, action) {
      state.list.push(action.payload);
    },
    removeError(state, action) {
      state.list = state.list.filter(err => err !== action.payload)
    }
  }
});

// Export actions
export const { addError, removeError } = errorsSlice.actions;

// Export reducer
export default errorsSlice.reducer;
