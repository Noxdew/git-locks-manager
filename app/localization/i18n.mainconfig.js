const i18n = require("i18next");
const backend = require("i18next-fs-backend");
const whitelist = require("./whitelist");
const path = require('path');
const { app } = require('electron');

i18n
  .use(backend)
  .init({
    backend: {
      loadPath: path.resolve(app.getAppPath(), "./app/localization/locales/{{lng}}/{{ns}}.json"),
      addPath: path.resolve(app.getAppPath(), "./app/localization/locales/{{lng}}/{{ns}}.missing.json"),
    },
    debug: false,
    namespace: "translation",
    saveMissing: true,
    saveMissingTo: "current",
    fallbackLng: false, // set to false when generating translation files locally
    whitelist: whitelist.langs,
    keySeparator: false,
  });

module.exports = i18n;