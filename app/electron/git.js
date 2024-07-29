const { exec, spawn } = require('child_process');
const isEmpty = require('lodash/isEmpty');
const size = require('lodash/size');
const remove = require('lodash/remove');
const first = require('lodash/first');
const fs = require('fs');
const path = require('path');
const ini = require('ini');
const GitAttributes = require('git-attributes');
const fixPath = require('fix-path');

fixPath();

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
      if (stderr) {
        reject(stderr);
      } else if (err) {
        reject(err);
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
  return new Promise((resolve, reject) => {
    if (isEmpty(config)) {
      fs.unlink(path.join(repoRoot(repo), '.lfsconfig'), err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
      return;
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
      resolve(attrs.rules);
    });
  });
}

function createGitAttributes(repo, rules) {
  return new Promise((resolve, reject) => {
    const attrsPath = GitAttributes.findAttributesFile(repo, false);
    const attrs = new GitAttributes();
    attrs.rules = rules;
    fs.writeFile(attrsPath, attrs.serialize().replace(/\t/g, ' '), (err) => {
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
      if (stderr) {
        reject(stderr);
      } else if (err) {
        reject(err);
      }  else {
        resolve(path.basename(stdout.trim(), '.git'));
      }
    });
  });
}

function listLockableFiles(repo) {
  return Promise.all([
    new Promise((resolve, reject) => {
      const lsFiles = spawn('git', ['ls-files', '--recurse-submodules'], {
        cwd: repoRoot(repo),
      });
      const attrs = spawn('git', ['check-attr', '--stdin', 'lockable'], {
        cwd: repoRoot(repo),
      });

      let lsFilesError = '';
      lsFiles.stdout.on('data', function (data) {
        attrs.stdin.write(data);
      });
      lsFiles.stderr.on('data', function (data) {
        lsFilesError += data;
      });
      lsFiles.on('close', function (code) {
        if (code !== 0) {
          reject(lsFilesError);
        }
        attrs.stdin.end();
      });

      let attrsError = '';
      let attrsData = '';
      attrs.stdout.on('data', function (data) {
        attrsData += data;
      });
      attrs.stderr.on('data', function (data) {
        attrsError += data;
      });
      attrs.on('close', function (code) {
        if (code === 0) {
          resolve(attrsData
            .trim()
            .split('\n')
            .map(f => f.split(': lockable: '))
            .filter(f => size(f) === 2 && f[1] === 'set')
            .map(f => f[0]));
        } else {
          reject(attrsError);
        }
      });
    }),
    new Promise((resolve, reject) => {
      const locks = spawn('git', ['lfs', 'locks', '--json'], {
        cwd: repoRoot(repo),
      });
      let locksError = '';
      let locksData = '';
      locks.stdout.on('data', function (data) {
        locksData += data;
      });
      locks.stderr.on('data', function (data) {
        locksError += data;
      });
      locks.on('close', function (code) {
        if (code === 0) {
          resolve(JSON.parse(locksData));
        } else {
          reject(locksError);
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
      if (stderr) {
        reject(stderr);
      } else if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(stdout));
      }
    });
  });
}

function unlockFile(repo, file, force) {
  return new Promise((resolve, reject) => {
    exec(`git lfs unlock "${file}" --json${force ? " --force" : ""}`, {
      cwd: repoRoot(repo),
    }, (err, stdout, stderr) => {
      if (stderr) {
        reject(stderr);
      } else if (err) {
        reject(err);
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
