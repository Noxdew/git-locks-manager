const util = require('electron-util');

const is = util.is;
const api = util.api;

module.exports = () => {
  return new Promise((resolve, reject) => {
    if (is.development || !is.macos) {
      resolve();
      return;
    }

    if (api.app.isInApplicationsFolder()) {
      resolve();
      return;
    }

    const appName = 'name' in api.app ? api.app.name : api.app.getName();

    const clickedButtonIndex = api.dialog.showMessageBoxSync({
      type: 'error',
      message: 'Move to Applications folder?',
      detail: `${appName} must live in the Applications folder to be able to run correctly.`,
      buttons: [
        'Move to Applications folder',
        `Quit ${appName}`
      ],
      defaultId: 0,
      cancelId: 1
    });

    reject();

    if (clickedButtonIndex === 1) {
      api.app.quit();
      return;
    }

    api.app.moveToApplicationsFolder({
      conflictHandler: conflict => {
        if (conflict === 'existsAndRunning') { // Can't replace the active version of the app
          api.dialog.showMessageBoxSync({
            type: 'error',
            message: `Another version of ${api.app.getName()} is currently running. Quit it, then launch this version of the app again.`,
            buttons: [
              'OK'
            ]
          });

          api.app.quit();
        }

        return true;
      }
    });
  });
}