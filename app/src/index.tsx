import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import i18n from "I18n/i18n.config";
import { I18nextProvider } from "react-i18next";
import Root from "Core/root";
import { store, history } from "Redux/store/store";

import 'moment/locale/af';
import 'moment/locale/ar';
import 'moment/locale/bg';
import 'moment/locale/ca';
import 'moment/locale/cs';
import 'moment/locale/da';
import 'moment/locale/de';
import 'moment/locale/el';
import 'moment/locale/es';
import 'moment/locale/et';
import 'moment/locale/fa';
import 'moment/locale/fi';
import 'moment/locale/fil';
import 'moment/locale/fr';
import 'moment/locale/gu';
import 'moment/locale/he';
import 'moment/locale/hi';
import 'moment/locale/hr';
import 'moment/locale/hu';
import 'moment/locale/id';
import 'moment/locale/it';
import 'moment/locale/ja';
import 'moment/locale/kn';
import 'moment/locale/ko';
import 'moment/locale/lt';
import 'moment/locale/lv';
import 'moment/locale/ml';
import 'moment/locale/mr';
import 'moment/locale/ms';
import 'moment/locale/nl';
import 'moment/locale/nb'; // no
import 'moment/locale/pl';
import 'moment/locale/pt';
import 'moment/locale/ro';
import 'moment/locale/ru';
import 'moment/locale/sk';
import 'moment/locale/sr';
import 'moment/locale/sv';
import 'moment/locale/sw';
import 'moment/locale/ta';
import 'moment/locale/te';
import 'moment/locale/th';
import 'moment/locale/tr';
import 'moment/locale/uk';
import 'moment/locale/vi';
import 'moment/locale/zh-cn';

document.oncontextmenu = () => false;

const container = document.getElementById("target");
const root = createRoot(container);
root.render(
  <I18nextProvider i18n={i18n}>
    <Suspense fallback="loading">
      <Root store={store} history={history}></Root>
    </Suspense>
  </I18nextProvider>
);
