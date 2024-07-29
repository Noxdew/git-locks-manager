import React from "react";
import styled from 'styled-components';
import { HistoryRouter } from "redux-first-history/rr6";
import { ThemeProvider, BaseStyles } from '@primer/react'
import { Provider } from "react-redux";
import AppRoutes from "Core/routes";
import i18n from "I18n/i18n.config";
import { writeUnprotectedConfigRequest } from "secure-electron-store";
import moment from 'moment';
import Nav from "./nav";
import RepoSelector from "Core/repoSelector";
import SettingsSelector from "Core/settingsSelector";
import MenuBar from 'Core/menuBar';
import Errors from "Core/errors";
import "./root.css";
import '@fontsource/roboto';

const BaseStylesFlex = styled(BaseStyles)`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

export default class Root extends React.Component {
  constructor(props) {
    super(props);
    const validThemes = ['day', 'night', 'auto'];

    let theme = window.api.store.initialUnprotected()['theme'];
    if (!validThemes.includes(theme)) {
      theme = 'auto';
      window.api.store.send(writeUnprotectedConfigRequest, 'theme', theme);
    }

    this.state = {
      theme,
    };
  }

  componentDidMount() {
    window.api.ipc.on('theme', (e, theme) => {
      window.api.store.send(writeUnprotectedConfigRequest, 'theme', theme);
      this.setState({ theme });
    });

    window.api.ipc.on('resize', (e, data) => {
      window.api.store.send(writeUnprotectedConfigRequest, 'width', data.width);
      window.api.store.send(writeUnprotectedConfigRequest, 'height', data.height);
    });

    i18n.on('languageChanged', function (lng) {
      moment.locale(lng === 'no' ? 'nb' : lng);
      window.api.store.send(writeUnprotectedConfigRequest, 'locale', lng);
    });

    i18n.changeLanguage(window.api.store.initialUnprotected()['locale'] || 'en');
  }

  render() {
    const { store, history } = this.props;

    return (
      <React.Fragment>
        <Provider store={store}>
          <HistoryRouter history={history}>
            <ThemeProvider colorMode={this.state.theme}>
              <BaseStylesFlex>
                <MenuBar />
                <Nav history={history}></Nav>
                <RepoSelector />
                <SettingsSelector />
                <Errors />
                <AppRoutes></AppRoutes>
              </BaseStylesFlex>
            </ThemeProvider>
          </HistoryRouter>
        </Provider>
      </React.Fragment>
    );
  }
}
