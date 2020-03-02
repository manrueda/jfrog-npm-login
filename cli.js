#!/usr/bin/env node
'use strict';
const meow = require('meow');
const chalk = require('chalk');
const success = chalk.green;
const info = chalk.cyan;
const error = chalk.red.bold;
const {
  getRegistries,
  deleteRegistry,
  normalizeKey,
  getNewConfiguration
} = require('./index.js');

const cli = meow(
  `
    Usage
      $ jnl [action] [options]

    Action
      list    List all jFrog registries configured on the user .npmrc
      add     Add a new jFrog registry to the user .npmrc
      delete  Remove a jFrog registry from the user .npmrc


    Options
      --url, -u  URL of the registry to configure
      --token, -t  jFrog registry auth token

    Examples
      $ jnl list
      $ jnl add --url //my-domain.com/artifactory/api/npm/default/ --token XXXXXXX
      $ jnl delete --url //my-domain.com/artifactory/api/npm/default/
`,
  {
    flags: {
      url: {
        type: 'string'
      },
      token: {
        type: 'string'
      }
    }
  }
);

const registryDisplay = (name, options) => `
${success('Registry:')} ${success(name)}
  ${Object.keys(options)
    .filter(key => key !== '_password')
    .map(
      key => `
    ${info(key)}\t\t${info(options[key])}`
    )
    .join('')}
`;

async function runListAction() {
  const regs = await getRegistries();
  for (const key in regs) {
    process.stdout.write(registryDisplay(key, regs[key]));
  }
}

async function runDeleteAction(registryKey) {
  const regs = await getRegistries();
  const reg = regs[registryKey];
  if (!reg) {
    process.stdout.write(
      info(`The registry ${registryKey} doesn't exist in your configuration`)
    );
    return;
  }
  await deleteRegistry(registryKey);
  process.stdout.write(success(`The registry ${registryKey} was removed!`));
}

async function runAddAction(registryKey, token) {
  const regs = await getRegistries();
  const reg = regs[registryKey];
  if (reg) {
    process.stdout.write(
      info(`The registry ${registryKey} already exists in your configuration`)
    );
    return;
  }
  await getNewConfiguration(registryKey, token);
  process.stdout.write(success(`The registry ${registryKey} was added!`));
}

function catchFn(err) {
  console.error(error(`Error: ${err}`));
  process.exit(1);
}

const action = cli.input[0];

switch (action) {
  case 'list':
    return runListAction().catch(catchFn);
  case 'delete':
    if (!cli.flags.url) {
      return catchFn('--url option is required');
    }

    return runDeleteAction(normalizeKey(cli.flags.url)).catch(catchFn);
  case 'add':
    if (!cli.flags.url) {
      return catchFn('--url option is required');
    }
    if (!cli.flags.token) {
      return catchFn('--token option is required');
    }

    return runAddAction(normalizeKey(cli.flags.url), cli.flags.token).catch(
      catchFn
    );
  default:
    return cli.showHelp();
}
