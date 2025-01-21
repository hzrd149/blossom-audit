`blossom-audit download`
========================

Audit downloading a blob from a server

* [`blossom-audit download SERVER [HASH]`](#blossom-audit-download-server-hash)

## `blossom-audit download SERVER [HASH]`

Audit downloading a blob from a server

```
USAGE
  $ blossom-audit download SERVER [HASH] [-v] [--sec <value>] [--connect <value>]

ARGUMENTS
  SERVER  The URL of the blossom server
  HASH    The sha256 hash of the blob to download

FLAGS
  -v, --verbose          Enable verbose logging
      --connect=<value>  A NIP-46 bunker URI that will be used to sign authorization events
      --sec=<value>      A private key that will be used to sign authorization events

DESCRIPTION
  Audit downloading a blob from a server
```

_See code: [src/commands/download.ts](https://github.com/hzrd149/blossom-audit/blob/v0.1.0/src/commands/download.ts)_
