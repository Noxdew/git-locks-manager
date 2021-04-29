import React from "react";
import ThemeProvider from '@primer/components/lib/ThemeProvider';
import BaseStyles from '@primer/components/lib/BaseStyles';
import { ConnectedRouter } from "connected-react-router";
import { Provider } from "react-redux";
import styled from 'styled-components';
import Routes from "Core/routes";
import Nav from "./nav";
import RepoSelector from "./repoSelector";
import SettingsSelector from "./settingsSelector";
import Errors from "./errors";
import { writeConfigRequest } from "secure-electron-store";
import "./root.css";
import 'fontsource-roboto';

const BaseStylesFlex = styled(BaseStyles)`
  flex: 1;
  display: flex;
  flex-direction: column;

  & > *:last-child {
    padding-top: 50px;
  }
`;

class Root extends React.Component {
  constructor(props) {
    super(props);
    const validThemes = ['day', 'night', 'auto'];

    let theme = window.api.store.initial()['theme'];
    if (!validThemes.includes(theme)) {
      theme = 'auto';
      window.api.store.send(writeConfigRequest, 'theme', theme);
    }

    this.state = {
      theme,
    };

    window.api.ipc.on('theme', (e, theme) => {
      window.api.store.send(writeConfigRequest, 'theme', theme);
      this.setState({ theme });
    });
  }

  render() {
    const { store, history } = this.props;

    return (
      <React.Fragment>
        <Provider store={store}>
          <ConnectedRouter history={history}>
            <ThemeProvider colorMode={this.state.theme}>
              <BaseStylesFlex>
                <Nav history={history}></Nav>
                <RepoSelector />
                <SettingsSelector />
                <Errors />
                <Routes></Routes>
              </BaseStylesFlex>
            </ThemeProvider>
          </ConnectedRouter>
        </Provider>
      </React.Fragment>
    );
  }
}

export default Root;