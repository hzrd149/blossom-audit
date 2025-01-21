`blossom-audit upload`
======================

Audit uploading a blob to a server

* [`blossom-audit upload SERVER FILE`](#blossom-audit-upload-server-file)

## `blossom-audit upload SERVER FILE`

Audit uploading a blob to a server

```
USAGE
  $ blossom-audit upload SERVER FILE [-v] [--sec <value>] [--connect <value>]

ARGUMENTS
  SERVER  The URL of the server to upload to
  FILE    A path to a local file to upload. or "bitcoin" to use the built-in example file

FLAGS
  -v, --verbose          Enable verbose logging
      --connect=<value>  A NIP-46 bunker URI that will be used to sign authorization events
      --sec=<value>      A private key that will be used to sign authorization events

DESCRIPTION
  Audit uploading a blob to a server
```

_See code: [src/commands/upload.ts](https://github.com/hzrd149/blossom-audit/blob/v0.1.0/src/commands/upload.ts)_
