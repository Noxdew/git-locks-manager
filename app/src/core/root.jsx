import React from "react";
import { ThemeProvider } from '@material-ui/core/styles';
import { ConnectedRouter } from "connected-react-router";
import { Provider } from "react-redux";
import Routes from "Core/routes";
import Nav from "./nav";
import "./root.css";
import 'fontsource-roboto';

const theme = {};

class Root extends React.Component {
  render() {
    const { store, history } = this.props;

    return (
      <React.Fragment>
        <Provider store={store}>
          <ConnectedRouter history={history}>
            <ThemeProvider theme={theme}>
              <Nav history={history}></Nav>
              <Routes></Routes>
            </ThemeProvider>
          </ConnectedRouter>
        </Provider>
      </React.Fragment>
    );
  }
}

export default Root;
