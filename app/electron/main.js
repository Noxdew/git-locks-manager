const {
  app,
  protocol,
  BrowserWindow,
  session,
  ipcMain,
  Menu,
  dialog,
  systemPreferences,
} = require("electron");
const {
  default: installExtension,
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS
} = require('electron-devtools-installer');
const Protocol = require("./protocol");
const MenuBuilder = require("./menu");
const i18nextBackend = require("i18next-electron-fs-backend");
const i18nextMainBackend = require("../localization/i18n.mainconfig");
const Store = require("secure-electron-store").default;
const ContextMenu = require("secure-electron-context-menu").default;
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");
const debounce = require('lodash/debounce');
const enforceMacOSAppLocation = require('./enforceMacOSAppLocation');
const isDev = process.env.NODE_ENV === "development";
const port = 40992; // Hardcoded; needs to match webpack.development.js and package.json
const selfHost = `http://localhost:${port}`;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let menuBuilder;
let store;
let locale;

app.setName("Git Locks Manager");

async function createWindow() {
  // If you'd like to set up auto-updating for your app,
  // I'd recommend looking at https://github.com/iffy/electron-updater-example
  // to use the method most suitable for you.
  autoUpdater.checkForUpdatesAndNotify();

  if (!isDev) {
    // Needs to happen before creating/loading the browser window;
    // protocol is only used in prod
    protocol.registerBufferProtocol(Protocol.scheme, Protocol.requestHandler); /* eng-disable PROTOCOL_HANDLER_JS_CHECK */
  }

  if (!store) {
    store = new Store({
      path: app.getPath("userData"),
    });
  }

  // Use saved config values for configuring your
  // BrowserWindow, for instance.
  // NOTE - this config is not passcode protected
  // and stores plaintext values
  let savedConfig;
  try {
    savedConfig = store.mainInitialStore(fs);
    console.log(savedConfig);
  } catch (e) {
    console.error(e);
    fs.unlinkSync(store.options.unprotectedPath);
    app.quit();
    return;
  }

  const minWidth = 950;
  const minHeight = 650;
  locale = savedConfig.locale || 'en';

  // Create the browser window.
  win = new BrowserWindow({
    width: savedConfig.width || minWidth,
    height: savedConfig.height || minHeight,
    minWidth,
    minHeight,
    title: "The application is currently initialising...",
    titleBarStyle: process.platform === 'darwin' ? "hidden" : undefined,
    frame: process.platform !== 'win32',
    backgroundColor: '#fff',
    show: false,
    webPreferences: {
      devTools: isDev,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      contextIsolation: true,
      enableRemoteModule: false,
      additionalArguments: [`storePath:${app.getPath("userData")}`],
      preload: path.join(__dirname, "preload.js"), /* eng-disable PRELOAD_JS_CHECK */
      disableBlinkFeatures: "Auxclick"
    }
  });

  // Sets up main.js bindings for our i18next backend
  i18nextBackend.mainBindings(ipcMain, win, fs);
  // Overwrite the readFileRequest handler in order to use relative paths to the appPath
  ipcMain.removeAllListeners(i18nextBackend.readFileRequest);
  ipcMain.on(i18nextBackend.readFileRequest, (IpcMainEvent, args) => {
    const callback = function (error, data) {
      this.webContents.send(i18nextBackend.readFileResponse, {
        key: args.key,
        error,
        data: typeof data !== "undefined" && data !== null ? data.toString() : ""
      });
    }.bind(win);
    fs.readFile(path.resolve(app.getAppPath(), args.filename), "utf8", callback);
  });

  // Sets up main.js bindings for our electron store;
  // callback is optional and allows you to use store in main process
  const callback = function (success, initialStore) {
    console.log(`${!success ? "Un-s" : "S"}uccessfully retrieved store in main process.`);
    console.log(initialStore); // {"key1": "value1", ... }
  };

  const callbackUnprotected = function (success, initialStore) {
    console.log(`${!success ? "Un-s" : "S"}uccessfully retrieved unprotected store in main process.`);
    console.log(initialStore); // {"key1": "value1", ... }
  };

  store.mainBindings(ipcMain, win, fs, callback, callbackUnprotected);

  // Sets up bindings for our custom context menu
  ContextMenu.mainBindings(ipcMain, win, Menu, isDev, {
    "loudAlertTemplate": [{
      id: "loudAlert",
      label: "AN ALERT!"
    }],
    "softAlertTemplate": [{
      id: "softAlert",
      label: "Soft alert"
    }]
  });

  // Load app
  if (isDev) {
    win.loadURL(selfHost);
  } else {
    win.loadURL(`${Protocol.scheme}://rse/index.html`);
  }

  win.webContents.on("did-finish-load", () => {
    win.setTitle(`Git Locks Manager (v${app.getVersion()})`);
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  // Only do these things when in development
  if (isDev) {
    // Errors are thrown if the dev tools are opened
    // before the DOM is ready
    win.webContents.once("dom-ready", async () => {
      await installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
        .then((name) => console.log(`Added Extension:  ${name}`))
        .catch((err) => console.log("An error occurred: ", err))
        .finally(() => {
          require("electron-debug")(); // https://github.com/sindresorhus/electron-debug
          win.webContents.openDevTools();
        });
    });
  }

  let quitting = false
  app.on('before-quit', () => {
    quitting = true;
  });

  if (process.platform === 'darwin') {
    win.on('close', e => {
      if (!quitting) {
        e.preventDefault()
        Menu.sendActionToFirstResponder('hide:')
      }
    });
  }

  // Emitted when the window is closed.
  win.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  win.on("resize", debounce(() => {
    const [ width, height ] = win.getSize();
    console.log(width, height)
    win.webContents.send('resize', { width, height });
  }, 1000));

  win.on("enter-full-screen", () => {
    win.webContents.send("is-fullscreen", true);
  });

  win.on("enter-html-full-screen", () => {
    win.webContents.send("is-fullscreen", true);
  });

  win.on("leave-full-screen", () => {
    win.webContents.send("is-fullscreen", false);
  });

  win.on("leave-html-full-screen", () => {
    win.webContents.send("is-fullscreen", false);
  });

  win.on('is-maximised', () => {
    win.webContents.send("is-maximised", win.isMaximized());
  });

  win.on('maximize', () => {
    win.webContents.send("is-maximised", true);
  });

  win.on('unmaximize', () => {
    win.webContents.send("is-maximised", false);
  });

  ipcMain.on('select-repo', async () => {
    dialog.showOpenDialog(win, {
      title: i18nextMainBackend.t('Select a Git Repository'),
      properties: ['openDirectory'],
    }).then(({ filePaths: [ path ] }) => {
      win.webContents.send('add-repo', { path });
    }).catch((err) => {
      console.log(err)
    });
  });

  ipcMain.on('title-bar-double-click', () => {
    const actionOnDoubleClick = systemPreferences.getUserDefault(
      'AppleActionOnDoubleClick',
      'string'
    );

    switch (actionOnDoubleClick) {
      case 'Maximize':
        if (win.isMaximized()) {
          win.unmaximize()
        } else {
          win.maximize()
        }
        break
      case 'Minimize':
        win.minimize()
        break
    }
  });

  ipcMain.on('is-fullscreen', () => {
    win.webContents.send("is-fullscreen", win.isFullScreen());
  });

  ipcMain.on('is-maximised', () => {
    win.webContents.send("is-maximised", win.isMaximized());
  });

  ipcMain.on('minimize', () => {
    win.minimize();
  });

  ipcMain.on('maximize', () => {
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });

  ipcMain.on('close', () => {
    win.close();
  });

  const getMenuList = () => {
    const menu = Menu.getApplicationMenu();
    if (!menu) {
      return [];
    }

    return menu.items
      .filter(mi => mi.submenu)
      .map(mi => ({ label: mi.label }));
  };

  ipcMain.on('get-menu', () => {
    win.webContents.send('menu-update', getMenuList());
  });

  ipcMain.on('open-menu', (e, data) => {
    const menu = Menu.getApplicationMenu();
    if (!menu) return;

    const menuItem = menu.items[data.index];
    if (!menuItem) return;

    const submenu = menuItem.submenu;
    if (!submenu) return;

    submenu.popup({
      x: Math.round(data.x),
      y: Math.round(data.y),
    });
  });

  // https://electronjs.org/docs/tutorial/security#4-handle-session-permission-requests-from-remote-content
  const ses = session;
  const partition = "default";
  ses.fromPartition(partition) /* eng-disable PERMISSION_REQUEST_HANDLER_JS_CHECK */
    .setPermissionRequestHandler((webContents, permission, permCallback) => {
      let allowedPermissions = []; // Full list here: https://developer.chrome.com/extensions/declare_permissions#manifest

      if (allowedPermissions.includes(permission)) {
        permCallback(true); // Approve permission request
      } else {
        console.error(
          `The application tried to request permission for '${permission}'. This permission was not whitelisted and has been blocked.`
        );

        permCallback(false); // Deny
      }
    });

  // https://electronjs.org/docs/tutorial/security#1-only-load-secure-content;
  // The below code can only run when a scheme and host are defined, I thought
  // we could use this over _all_ urls
  // ses.fromPartition(partition).webRequest.onBeforeRequest({urls:["http://localhost./*"]}, (listener) => {
  //   if (listener.url.indexOf("http://") >= 0) {
  //     listener.callback({
  //       cancel: true
  //     });
  //   }
  // });

  menuBuilder = MenuBuilder(app.name);

  i18nextMainBackend.on("languageChanged", (lng) => {
    locale = lng;
    menuBuilder.buildMenu(i18nextMainBackend);
    win.webContents.send('menu-update', getMenuList());
  });

  i18nextMainBackend.changeLanguage(locale);
}

// Needs to be called before app is ready;
// gives our scheme access to load relative files,
// as well as local storage, cookies, etc.
// https://electronjs.org/docs/api/protocol#protocolregisterschemesasprivilegedcustomschemes
protocol.registerSchemesAsPrivileged([{
  scheme: Protocol.scheme,
  privileges: {
    standard: true,
    secure: true
  }
}]);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  enforceMacOSAppLocation()
    .then(createWindow);
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  } else {
    i18nextBackend.clearMainBindings(ipcMain);
    ContextMenu.clearMainBindings(ipcMain);
    store.clearMainBindings(ipcMain);
    ipcMain.removeAllListeners('select-repo');
    ipcMain.removeAllListeners('title-bar-double-click');
    ipcMain.removeAllListeners('is-fullscreen');
    ipcMain.removeAllListeners('is-maximised');
    ipcMain.removeAllListeners('minimize');
    ipcMain.removeAllListeners('maximize');
    ipcMain.removeAllListeners('close');
    ipcMain.removeAllListeners('get-menu');
    ipcMain.removeAllListeners('open-menu');
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// https://electronjs.org/docs/tutorial/security#12-disable-or-limit-navigation
app.on("web-contents-created", (event, contents) => {
  contents.on("will-navigate", (contentsEvent, navigationUrl) => { /* eng-disable LIMIT_NAVIGATION_JS_CHECK  */
    const parsedUrl = new URL(navigationUrl);
    const validOrigins = [selfHost];

    // Log and prevent the app from navigating to a new page if that page's origin is not whitelisted
    if (!validOrigins.includes(parsedUrl.origin)) {
      console.error(
        `The application tried to redirect to the following address: '${parsedUrl}'. This origin is not whitelisted and the attempt to navigate was blocked.`
      );

      contentsEvent.preventDefault();
      return;
    }
  });

  contents.on("will-redirect", (contentsEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const validOrigins = [];

    // Log and prevent the app from redirecting to a new page
    if (!validOrigins.includes(parsedUrl.origin)) {
      console.error(
        `The application tried to redirect to the following address: '${navigationUrl}'. This attempt was blocked.`
      );

      contentsEvent.preventDefault();
      return;
    }
  });

  // https://electronjs.org/docs/tutorial/security#11-verify-webview-options-before-creation
  contents.on("will-attach-webview", (contentsEvent, webPreferences, params) => {
    // Strip away preload scripts if unused or verify their location is legitimate
    delete webPreferences.preload;
    delete webPreferences.preloadURL;

    // Disable Node.js integration
    webPreferences.nodeIntegration = false;
  });

  // https://electronjs.org/docs/tutorial/security#13-disable-or-limit-creation-of-new-windows
  contents.on("new-window", (contentsEvent, navigationUrl) => { /* eng-disable LIMIT_NAVIGATION_JS_CHECK */
    const parsedUrl = new URL(navigationUrl);
    const validOrigins = [];

    // Log and prevent opening up a new window
    if (!validOrigins.includes(parsedUrl.origin)) {
      console.error(
        `The application tried to open a new window at the following address: '${navigationUrl}'. This attempt was blocked.`
      );

      contentsEvent.preventDefault();
      return;
    }
  });
});

// Filter loading any module via remote;
// you shouldn't be using remote at all, though
// https://electronjs.org/docs/tutorial/security#16-filter-the-remote-module
app.on("remote-require", (event, webContents, moduleName) => {
  event.preventDefault();
});

// built-ins are modules such as "app"
app.on("remote-get-builtin", (event, webContents, moduleName) => {
  event.preventDefault();
});

app.on("remote-get-global", (event, webContents, globalName) => {
  event.preventDefault();
});

app.on("remote-get-current-window", (event, webContents) => {
  event.preventDefault();
});

app.on("remote-get-current-web-contents", (event, webContents) => {
  event.preventDefault();
});

autoUpdater.on('update-downloaded', (info) => {
  autoUpdater.quitAndInstall();
});
