`blossom-audit audit`
=====================

Run a full upload / download audit on a server

* [`blossom-audit audit SERVER FILE`](#blossom-audit-audit-server-file)

## `blossom-audit audit SERVER FILE`

Run a full upload / download audit on a server

```
USAGE
  $ blossom-audit audit SERVER FILE [-v]

ARGUMENTS
  SERVER  The URL of the blossom server
  FILE    A path to a local file to upload. or "bitcoin" to use the built-in example file

FLAGS
  -v, --verbose  Enable verbose logging

DESCRIPTION
  Run a full upload / download audit on a server
```

_See code: [src/commands/audit.ts](https://github.com/hzrd149/blossom-audit/blob/v0.1.0/src/commands/audit.ts)_
