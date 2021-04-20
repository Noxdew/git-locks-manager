const exec = require('child_process').exec;
const isEmpty = require('lodash/isEmpty');
const fs = require('fs');
const path = require('path');

function remotes(path) {
  return new Promise((resolve, reject) => {
    exec('git remote', {
      cwd: path
    }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else if (stderr) {
        reject(stderr);
      } else {
        resolve(stdout.split('\n'));
      }
    });
  });
}

function createLfsconfig(repo, config) {
  if (isEmpty(config)) {
    // TODO: Promise
    fs.unlink(path.join(repo, '.lfsconfig'));
    return;
  }

  let lfsconfig = `
[remote "${config.remote}"]
lfsurl = ${config.url}

[lfs]
locksverify = true
`;

  if (config.auth) {
    const url = new URL(config.url);
    lfsconfig += `
[lfs "${url.origin}"]
access = "basic"
`;
  }

  // TODO: promise
  fs.writeFile(path.join(repo, '.lfsconfig'), lfsconfig, function (err) {
    if (err) return console.log(err);
  });
}

function createGitAttributes(path, config) {
  // <the file regex> <filter=lfs diff=lfs merge=lfs -text if stored in lfs> <lockable>
//   # 3D models
// *.3dm filter=lfs diff=lfs merge=lfs -text lockable
// *.3ds filter=lfs diff=lfs merge=lfs -text lockable
// *.blend filter=lfs diff=lfs merge=lfs -text lockable
// *.c4d filter=lfs diff=lfs merge=lfs -text lockable
// *.collada filter=lfs diff=lfs merge=lfs -text lockable
// *.dae filter=lfs diff=lfs merge=lfs -text lockable
// *.dxf filter=lfs diff=lfs merge=lfs -text lockable
// *.fbx filter=lfs diff=lfs merge=lfs -text lockable
// *.jas filter=lfs diff=lfs merge=lfs -text lockable
// *.lws filter=lfs diff=lfs merge=lfs -text lockable
// *.lxo filter=lfs diff=lfs merge=lfs -text lockable
// *.ma filter=lfs diff=lfs merge=lfs -text lockable
// *.max filter=lfs diff=lfs merge=lfs -text lockable
// *.mb filter=lfs diff=lfs merge=lfs -text lockable
// *.obj filter=lfs diff=lfs merge=lfs -text lockable
// *.ply filter=lfs diff=lfs merge=lfs -text lockable
// *.skp filter=lfs diff=lfs merge=lfs -text lockable
// *.stl filter=lfs diff=lfs merge=lfs -text lockable
// *.ztl filter=lfs diff=lfs merge=lfs -text lockable
// # Audio
// *.aif filter=lfs diff=lfs merge=lfs -text lockable
// *.aiff filter=lfs diff=lfs merge=lfs -text lockable
// *.it filter=lfs diff=lfs merge=lfs -text lockable
// *.mod filter=lfs diff=lfs merge=lfs -text lockable
// *.mp3 filter=lfs diff=lfs merge=lfs -text lockable
// *.ogg filter=lfs diff=lfs merge=lfs -text lockable
// *.s3m filter=lfs diff=lfs merge=lfs -text lockable
// *.wav filter=lfs diff=lfs merge=lfs -text lockable
// *.xm filter=lfs diff=lfs merge=lfs -text lockable
// # Fonts
// *.otf filter=lfs diff=lfs merge=lfs -text lockable
// *.ttf filter=lfs diff=lfs merge=lfs -text lockable
// # Images
// *.bmp filter=lfs diff=lfs merge=lfs -text lockable
// *.exr filter=lfs diff=lfs merge=lfs -text lockable
// *.gif filter=lfs diff=lfs merge=lfs -text lockable
// *.hdr filter=lfs diff=lfs merge=lfs -text lockable
// *.iff filter=lfs diff=lfs merge=lfs -text lockable
// *.jpeg filter=lfs diff=lfs merge=lfs -text lockable
// *.jpg filter=lfs diff=lfs merge=lfs -text lockable
// *.pict filter=lfs diff=lfs merge=lfs -text lockable
// *.png filter=lfs diff=lfs merge=lfs -text lockable
// *.psd filter=lfs diff=lfs merge=lfs -text lockable
// *.tga filter=lfs diff=lfs merge=lfs -text lockable
// *.tif filter=lfs diff=lfs merge=lfs -text lockable
// *.tiff filter=lfs diff=lfs merge=lfs -text lockable
}

function getRepoName(path) {

}

function listLockableFiles(path) {
    // exec('git ls-files | git check-attr --stdin lockable', {

    // git lfs locks --json
}

function lockFile(path, file) {

}

function unlockFile(path, file) {

}

module.exports = {
  remotes,
}