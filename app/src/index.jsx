import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import i18n from "I18n/i18n.config";
import { I18nextProvider } from "react-i18next";
import Root from "Core/root";
import store, { history } from "Redux/store/store";
import "bulma/css/bulma.css";
import {
  writeUnprotectedConfigRequest,
} from "secure-electron-store";

ReactDOM.render(
  <I18nextProvider i18n={i18n}>
    <Suspense fallback="loading">
      <Root store={store} history={history}></Root>
    </Suspense>
  </I18nextProvider>,
  document.getElementById("target")
);

window.api.ipc.on('resize', (e, data) => {
  window.api.store.send(writeUnprotectedConfigRequest, 'width', data.width);
  window.api.store.send(writeUnprotectedConfigRequest, 'height', data.height);
});
