import React from "react";
import { Routes, Route } from "react-router";
import ROUTES from "Constants/routes";
import loadable from "@loadable/component";

// Load bundles asynchronously so that the initial render happens faster
const Welcome = loadable(() =>
  import(/* webpackChunkName: "WelcomeChunk" */ "Pages/welcome/welcome")
);
const Repo = loadable(() =>
  import(/* webpackChunkName: "RepoChunk" */ "Pages/repo/files")
);
const RepoAttributes = loadable(() =>
  import(/* webpackChunkName: "GitAttributesChunk" */ "Pages/repo/attributes")
);
const LFSConfig = loadable(() =>
  import(/* webpackChunkName: "LFSConfigChunk" */ "Pages/repo/lfsconfig")
);

class AppRoutes extends React.Component {
  render() {
    return (
      <Routes>
        <Route path={ROUTES.WELCOME} element={<Welcome />} />
        <Route path={ROUTES.REPO} element={<Repo />} />
        <Route path={ROUTES.REPO_ATTRIBUTES} element={<RepoAttributes />}></Route>
        <Route path={ROUTES.REPO_LFS_CONFIG} element={<LFSConfig />}></Route>
      </Routes>
    );
  }
}

export default AppRoutes;