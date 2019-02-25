const npm = require('npm');
const got = require('got');
const { promisify } = require('util');
const loadNpm = promisify(npm.load);
const saveUserNpm = promisify(cb => npm.config.save('user', cb));
const getBaseURL = url => {
  const result = url.match(/(^.*?(\/api))/);
  return result ? result[1] : null;
};

function normalizeKey(key) {
  if (key.startsWith('https:')) {
    key = key.replace('https://', '//');
  }
  if (key.startsWith('http:')) {
    key = key.replace('http://', '//');
  }
  if (!key.startsWith('//')) {
    if (key.substring[0] !== '/') {
      key = `//${key}`;
    } else {
      if (key.substring[1] !== '/') {
        key = `/${key}`;
      }
    }
  }
  if (!key.endsWith('/')) {
    key = key + '/';
  }
  return key;
}

function parseJfrogRegistries(data) {
  const jfrogKeys = Object.keys(data).filter(key => key.startsWith('@jfrog'));
  const registries = {};
  for (const jfrogKey of jfrogKeys) {
    const url = normalizeKey(data[jfrogKey]);
    const repoDataKeys = Object.keys(data).filter(key => key.startsWith(url));
    const regData = {};
    for (const repoDataKey of repoDataKeys) {
      regData[repoDataKey.replace(`${url}:`, '')] = data[repoDataKey];
    }
    registries[url] = regData;
  }
  return registries;
}

async function getRegistries() {
  if (!npm.config.loaded) {
    await loadNpm();
  }
  const data = npm.config.sources.user.data;
  return parseJfrogRegistries(data);
}

async function deleteRegistry(keyToRemove) {
  if (!npm.config.loaded) {
    await loadNpm();
  }
  const data = npm.config.sources.user.data;
  const jfrogKeys = Object.keys(data).filter(key => key.startsWith('@jfrog'));
  for (const jfrogKey of jfrogKeys) {
    const url = normalizeKey(data[jfrogKey]);
    if (url === keyToRemove) {
      delete data[jfrogKey];
      const repoDataKeys = Object.keys(data).filter(key => key.startsWith(url));
      for (const repoDataKey of repoDataKeys) {
        delete data[repoDataKey];
      }
    }
  }
  return saveUserNpm();
}

async function getNewConfiguration(key, token) {
  // await makesSense(key, token);
  if (!npm.config.loaded) {
    await loadNpm();
  }
  const response = await got(`http:${key}auth/jfrog`, {
    headers: { 'X-JFrog-Art-Api': token }
  });
  const values = response.body.split('\n').map(v => v.split('='));
  for (const [key, value] of values) {
    if (key && value) {
      npm.config.set(key, value, 'user');
    }
  }
  return saveUserNpm();
}

async function makesSense(key, token) {
  const response = await got(`http:${getBaseURL(key)}/system/version`, {
    headers: { 'X-JFrog-Art-Api': token },
    json: true
  });
  const [major, minor] = response.body.version.split('.');
  if (Number(major) >= 5 && Number(minor) >= 4) {
    throw new Error(
      `The jFrog server is in version ${
        response.body.version
      } you can user 'npm login' to authenticate.`
    );
  }
}

module.exports = {
  getRegistries,
  deleteRegistry,
  normalizeKey,
  getNewConfiguration
};
