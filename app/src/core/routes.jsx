import React from "react";
import { Switch, Route } from "react-router";
import ROUTES from "Constants/routes";
import loadable from "@loadable/component";

// Load bundles asynchronously so that the initial render happens faster
const Welcome = loadable(() =>
  import(/* webpackChunkName: "WelcomeChunk" */ "Pages/welcome/welcome")
);
const Repo = loadable(() =>
  import(/* webpackChunkName: "RepoChunk" */ "Pages/about/about")
);
const RepoAttributes = loadable(() =>
  import(/* webpackChunkName: "GitAttributesChunk" */ "Pages/motd/motd")
);
const LFSConfig = loadable(() =>
  import(
    /* webpackChunkName: "LFSConfigChunk" */ "Pages/localization/localization"
  )
);

class Routes extends React.Component {
  render() {
    return (
      <Switch>
        <Route exact path={ROUTES.WELCOME} component={Welcome}></Route>
        <Route path={ROUTES.REPO} component={Repo}></Route>
        <Route path={ROUTES.REPO_ATTRIBUTES} component={RepoAttributes}></Route>
        <Route path={ROUTES.REPO_LFS_CONFIG} component={LFSConfig}></Route>
      </Switch>
    );
  }
}

export default Routes;
