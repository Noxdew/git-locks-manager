import {
  combineReducers
} from "redux";
import {
  configureStore,
  getDefaultMiddleware
} from "@reduxjs/toolkit";
import {
  createHashHistory
} from "history";
import {
  createReduxHistoryContext
} from "redux-first-history";
import reposReducer from "../components/repos/reposSlice";
import errorsReducer from "../components/errors/errorsSlice";
import filesReducer from "../components/files/filesSlice";
import settingsReducer from "../components/settings/settingsSlice";

const {
  routerMiddleware,
  createReduxHistory,
  routerReducer
} = createReduxHistoryContext({
  history: createHashHistory()
});

export const store = configureStore({
  reducer: combineReducers({
    router: routerReducer,
    repos: reposReducer,
    errors: errorsReducer,
    files: filesReducer,
    settings: settingsReducer,
  }),
  middleware: [...getDefaultMiddleware({
    serializableCheck: false
  }), routerMiddleware]
});

export const history = createReduxHistory(store);