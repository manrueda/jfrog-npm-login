const npm = require('npm');
const got = require('got');
const tunnel = require('tunnel');
const { promisify } = require('util');
const loadNpm = promisify(npm.load);
const saveUserNpm = promisify(cb => npm.config.save('user', cb));

function normalizeKey(key) {
  // if (key.startsWith('https:')) {
  //   key = key.replace('https://', 'https://');
  // }
  // if (key.startsWith('http:')) {
  //   key = key.replace('http://', 'http://');
  // }
  if (key.startsWith('//')) {
    if (key.substring[0] !== '/') {
      key = `https://${key}`;
    } else {
      if (key.substring[1] !== '/') {
        key = `https:/${key}`;
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

function getProxyAgent() {
  if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
    const { protocol, port, host } = new URL(
      process.env.HTTP_PROXY || process.env.HTTPS_PROXY
    );
    if (protocol === 'https:') {
      return tunnel.httpsOverHttps({
        proxy: { port: parseInt(port || '80'), host }
      });
    } else {
      console.log(protocol, port, host);
      return tunnel.httpsOverHttp({
        proxy: { port: parseInt(port || '80'), host }
      });
    }
  } else {
    return undefined;
  }
}

async function getNewConfiguration(key, token) {
  if (!npm.config.loaded) {
    await loadNpm();
  }
  console.log(key);
  const proxyAgent = getProxyAgent();
  const response = await got(`${key}auth/jfrog`, {
    headers: { 'X-JFrog-Art-Api': token },
    agent: proxyAgent
  });
  const values = response.body.split('\n').map(v => v.split('='));
  for (const [key, value] of values) {
    if (key && value) {
      npm.config.set(key, value, 'user');
    }
  }
  return saveUserNpm();
}

module.exports = {
  getRegistries,
  deleteRegistry,
  normalizeKey,
  getNewConfiguration
};
