import { combineReducers } from "redux";
import { connectRouter } from "connected-react-router";
import reposReducer from "../components/repos/reposSlice";
import errorsReducer from "../components/errors/errorsSlice";
import filesReducer from "../components/files/filesSlice";
import settingsReducer from "../components/settings/settingsSlice";

const rootReducer = (history) =>
  combineReducers({
    router: connectRouter(history),
    repos: reposReducer,
    errors: errorsReducer,
    files: filesReducer,
    settings: settingsReducer,
  });

export default rootReducer;
