const exec = require('child_process').exec;
const isEmpty = require('lodash/isEmpty');
const size = require('lodash/size');
const remove = require('lodash/remove');
const first = require('lodash/first');
const fs = require('fs');
const path = require('path');
const ini = require('ini');
const GitAttributes = require('git-attributes');

function repoRoot(repoPath) {
  let gitBaseDir = repoPath;

  // Find the root of the repo
  while (
    !fs.existsSync(path.join(gitBaseDir, '.git')) ||
    !fs.existsSync(path.join(gitBaseDir, '.git/config'))) {

    let next = path.resolve(gitBaseDir, '..');
    if (next === gitBaseDir) break;

    gitBaseDir = next;
  }

  if (!fs.existsSync(path.join(gitBaseDir, '.git')) ||
    !fs.existsSync(path.join(gitBaseDir, '.git/config'))) {
    return null;
  }
  return gitBaseDir;
}

function remotes(repo) {
  return new Promise((resolve, reject) => {
    exec('git remote', {
      cwd: repoRoot(repo)
    }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else if (stderr) {
        reject(stderr);
      } else {
        resolve(stdout.trim().split('\n'));
      }
    });
  });
}

function readLfsconfig(repo) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(repoRoot(repo), '.lfsconfig'), (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(ini.decode(data.toString()));
    });
  });
}

function createLfsconfig(repo, config) {
  if (isEmpty(config)) {
    return new Promise((resolve, reject) => {
      fs.unlink(path.join(repoRoot(repo), '.lfsconfig'), err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  const obj = {
    [`remote "${config.remote}"`]: {
      lfsurl: config.url,
    },
    lfs: {
      locksverify: true,
    },
  };

  if (config.auth) {
    const url = new URL(config.url);
    const key = `lfs "${url.origin}"`;
    let cursor = obj;
    key.split('.').forEach(k => {
      cursor[k] = {};
      cursor = cursor[k];
    });
    cursor.access = "basic";
  }

  return new Promise((resolve, reject) => {
    fs.writeFile(path.join(repoRoot(repo), '.lfsconfig'), ini.stringify(obj), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function readGitAttributes(repo) {
  return new Promise((resolve, reject) => {
    const attrsPath = GitAttributes.findAttributesFile(repo);
    if (!attrsPath) {
      return resolve([]);
    }
    fs.readFile(attrsPath, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      const attrs = new GitAttributes();
      attrs.parse(data.toString(), true);
      console.log(attrs.rules);
      resolve(attrs.rules);
    });
  });
}

function createGitAttributes(repo, rules) {
  return new Promise((resolve, reject) => {
    const attrsPath = GitAttributes.findAttributesFile(repo, false);
    const attrs = new GitAttributes();
    attrs.rules = rules;
    console.log(attrs.serialize());
    fs.writeFile(attrsPath, attrs.serialize(), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function getRepoName(repo) {
  return new Promise((resolve, reject) => {
    exec('git config --get remote.origin.url', {
      cwd: repoRoot(repo),
    }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else if (stderr) {
        reject(stderr);
      } else {
        resolve(path.basename(stdout.trim(), '.git'));
      }
    });
  });
}

function listLockableFiles(repo) {
  return Promise.all([
    new Promise((resolve, reject) => {
      exec('git ls-files | git check-attr --stdin lockable', {
        cwd: repoRoot(repo),
      }, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else if (stderr) {
          reject(stderr);
        } else {
          resolve(stdout
            .trim()
            .split('\n')
            .map(f => f.split(': lockable: '))
            .filter(f => size(f) === 2 && f[1] === 'set')
            .map(f => f[0])
          );
        }
      });
    }),
    new Promise((resolve, reject) => {
      exec('git lfs locks --json', {
        cwd: repoRoot(repo),
      }, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else if (stderr) {
          reject(stderr);
        } else {
          resolve(JSON.parse(stdout));
        }
      });
    })
  ])
  .then(([files, locks]) => {
    return files.map(f => {
      const lock = remove(locks, lock => lock.path === f);
      return {
        path: f,
        lock: first(lock),
      };
    }).concat(locks.map(lock => ({
      path: lock.path,
      lock,
      isMissing: true,
    })));
  });
}

function lockFile(repo, file) {
  return new Promise((resolve, reject) => {
    exec(`git lfs lock "${file}" --json`, {
      cwd: repoRoot(repo),
    }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else if (stderr) {
        reject(stderr);
      } else {
        resolve(JSON.parse(stdout));
      }
    });
  });
}

function unlockFile(repo, file) {
  return new Promise((resolve, reject) => {
    exec(`git lfs unlock "${file}" --json`, {
      cwd: repoRoot(repo),
    }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else if (stderr) {
        reject(stderr);
      } else {
        resolve(JSON.parse(stdout));
      }
    });
  });
}

module.exports = {
  getRepoName,
  listLockableFiles,
  lockFile,
  unlockFile,
  remotes,
  readLfsconfig,
  createLfsconfig,
  readGitAttributes,
  createGitAttributes,
};
