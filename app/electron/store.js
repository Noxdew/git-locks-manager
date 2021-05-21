const fs = require('fs');
const path = require('path');

const STORE_READ_REQUEST = 'store-read-request';
const STORE_READ_RESPONSE = 'store-read-response';
const STORE_WRITE_REQUEST = 'store-write-request';
const STORE_WRITE_RESPONSE = 'store-write-response';

const promiseCache = {};

class Store {
  filePath;
  initialRead = false;
  initialData;
  isLoadedOnRenderer = false;

  constructor(passedPath = '') {
    // Only run the following code in the renderer
    // process; we can determine if this is the renderer
    // process if we haven't set a new path from our options
    let basePath;
    if (process && process.type === 'renderer') {
      try {
        const arg = process.argv.filter(p => p.indexOf("storePath:") >= 0)[0];
        basePath = arg.substr(arg.indexOf(":") + 1);
      } catch (error) {
        throw new Error(`Could not find property 'additionalArguments' value beginning with 'storePath:' in your BrowserWindow. Please ensure this is set! Error: ${error}`);
      }
    } else {
      basePath = passedPath;
    }

    this.filePath = path.join(basePath, 'data.json');
  }

  mainBindings(ipcMain, win) {
    // reads the file once, ensures if the file is not there it is created
    this.initial();

    ipcMain.on(STORE_READ_REQUEST, (e, data) => {
      this.read(data.key)
        .then(value => {
          win.webContents.send(STORE_READ_RESPONSE, { key: data.key, value });
        })
        .catch(error => {
          win.webContents.send(STORE_READ_RESPONSE, { key: data.key, error });
        });
    });

    ipcMain.on(STORE_WRITE_REQUEST, (e, data) => {
      this.write(data.key, data.value)
        .then(value => {
          win.webContents.send(STORE_WRITE_RESPONSE, { key: data.key, value });
        })
        .catch(error => {
          win.webContents.send(STORE_WRITE_RESPONSE, { key: data.key, error });
        });
    });
  }

  clearMainBindings(ipcMain) {
    ipcMain.removeAllListeners(STORE_READ_RESPONSE);
    ipcMain.removeAllListeners(STORE_WRITE_RESPONSE);
  }

  preloadBindings(ipcRenderer) {
    // reads the file once, ensures if the file is not there it is created
    this.initial();

    ipcRenderer.on(STORE_READ_RESPONSE, (e, data) => {
      const promiseKey = `read_${data.key}`;
      promiseCache[promiseKey] = (promiseCache[promiseKey] || []);
      const promise = promiseCache[promiseKey].shift();
      if (!promise) return;

      if (data.error) {
        promise.reject(data.error);
      } else {
        promise.resolve(data.value);
      }
    });

    ipcRenderer.on(STORE_WRITE_RESPONSE, (e, data) => {
      const promiseKey = `write_${data.key}`;
      promiseCache[promiseKey] = (promiseCache[promiseKey] || []);
      const promise = promiseCache[promiseKey].shift();
      if (!promise) return;

      if (data.error) {
        promise.reject(data.error);
      } else {
        promise.resolve(data.value);
      }
    });

    return {
      initial: () => {
        return this.initial();
      },
      read(key) {
        return new Promise((resolve, reject) => {
          const promiseKey = `read_${key}`;
          promiseCache[promiseKey] = (promiseCache[promiseKey] || []);
          promiseCache[promiseKey].push({ resolve, reject });
          ipcRenderer.send(STORE_READ_REQUEST, { key });
        });
      },
      write(key, value) {
        return new Promise((resolve, reject) => {
          const promiseKey = `write_${key}`;
          promiseCache[promiseKey] = (promiseCache[promiseKey] || []);
          promiseCache[promiseKey].push({ resolve, reject });
          ipcRenderer.send(STORE_WRITE_REQUEST, { key, value });
        });
      }
    }
  }

  initial() {
    if (!this.initialRead) {
      try {
        const data = fs.readFileSync(this.filePath);
        const jsonData = JSON.parse(data);
        this.initialRead = true;
        this.initialData = jsonData;
      } catch (error) {
        if (error.code === "ENOENT" || error instanceof SyntaxError) {
          this.initialRead = true;
          this.initialData = {};
          fs.writeFileSync(this.filePath, '{}');
        } else {
          throw new Error(`[store] encountered error '${error}' when trying to read file '${this.filePath}'. This file is probably corrupted. To fix this error, you may set "reset" to true in the options in your main process where you configure your store, or you can turn off your app, delete (recommended) or fix this file and restart your app to fix this issue.`);
        }
      }
    }

    return this.initialData;
  }

  read(key) {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filePath, (err, data) => {
        if (err) return reject(err);
        const jsonData = JSON.parse(data);
        resolve(jsonData[key]);
      });
    });
  }

  write(key, value) {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filePath, (err, data) => {
        if (err) return reject(err);
        const jsonData = JSON.parse(data);
        jsonData[key] = value;
        fs.writeFileSync(this.filePath, JSON.stringify(jsonData));
        resolve();
      });
    });
  }
}

module.exports = Store;
