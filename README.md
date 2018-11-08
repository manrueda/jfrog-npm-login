# jfrog-npm-login

npm login CLI for jFrog Artifactory (version 5.4 or below).

This CLI works with the jFrog API to get the npm authentification data and save it in your user level `.npmrc`.

After version 5.4 of jFrog Artifactory, npm authentication can be done with `npm login`. This CLI is only useful for older versions.

## Install

```bash
npm install -g jfrog-npm-login
```

## Usage

The CLI can be used as `jfrog-npm-login` or `jnl`

### `list`

Lists all the jFrog Artifactory registries configured by the user.

```bash
jfrog-npm-login list
```

### `add`

Configures a new jFrog Artifactory registries for the user.

```bash
jfrog-npm-login add --url //my-domain.com/artifactory/api/npm/default/ --token XXXXXXX
```

### `delete`

Removes a configured jFrog Artifactory registries based on the URL.

```bash
jfrog-npm-login delete --url //my-domain.com/artifactory/api/npm/default/
```
