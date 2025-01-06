`blossom-audit plugins`
=======================

List installed plugins.

* [`blossom-audit plugins`](#blossom-audit-plugins)
* [`blossom-audit plugins add PLUGIN`](#blossom-audit-plugins-add-plugin)
* [`blossom-audit plugins:inspect PLUGIN...`](#blossom-audit-pluginsinspect-plugin)
* [`blossom-audit plugins install PLUGIN`](#blossom-audit-plugins-install-plugin)
* [`blossom-audit plugins link PATH`](#blossom-audit-plugins-link-path)
* [`blossom-audit plugins remove [PLUGIN]`](#blossom-audit-plugins-remove-plugin)
* [`blossom-audit plugins reset`](#blossom-audit-plugins-reset)
* [`blossom-audit plugins uninstall [PLUGIN]`](#blossom-audit-plugins-uninstall-plugin)
* [`blossom-audit plugins unlink [PLUGIN]`](#blossom-audit-plugins-unlink-plugin)
* [`blossom-audit plugins update`](#blossom-audit-plugins-update)

## `blossom-audit plugins`

List installed plugins.

```
USAGE
  $ blossom-audit plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ blossom-audit plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.24/src/commands/plugins/index.ts)_

## `blossom-audit plugins add PLUGIN`

Installs a plugin into blossom-audit.

```
USAGE
  $ blossom-audit plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into blossom-audit.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the BLOSSOM_AUDIT_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the BLOSSOM_AUDIT_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ blossom-audit plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ blossom-audit plugins add myplugin

  Install a plugin from a github url.

    $ blossom-audit plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ blossom-audit plugins add someuser/someplugin
```

## `blossom-audit plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ blossom-audit plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ blossom-audit plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.24/src/commands/plugins/inspect.ts)_

## `blossom-audit plugins install PLUGIN`

Installs a plugin into blossom-audit.

```
USAGE
  $ blossom-audit plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into blossom-audit.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the BLOSSOM_AUDIT_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the BLOSSOM_AUDIT_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ blossom-audit plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ blossom-audit plugins install myplugin

  Install a plugin from a github url.

    $ blossom-audit plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ blossom-audit plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.24/src/commands/plugins/install.ts)_

## `blossom-audit plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ blossom-audit plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ blossom-audit plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.24/src/commands/plugins/link.ts)_

## `blossom-audit plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ blossom-audit plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ blossom-audit plugins unlink
  $ blossom-audit plugins remove

EXAMPLES
  $ blossom-audit plugins remove myplugin
```

## `blossom-audit plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ blossom-audit plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.24/src/commands/plugins/reset.ts)_

## `blossom-audit plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ blossom-audit plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ blossom-audit plugins unlink
  $ blossom-audit plugins remove

EXAMPLES
  $ blossom-audit plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.24/src/commands/plugins/uninstall.ts)_

## `blossom-audit plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ blossom-audit plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ blossom-audit plugins unlink
  $ blossom-audit plugins remove

EXAMPLES
  $ blossom-audit plugins unlink myplugin
```

## `blossom-audit plugins update`

Update installed plugins.

```
USAGE
  $ blossom-audit plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.24/src/commands/plugins/update.ts)_
