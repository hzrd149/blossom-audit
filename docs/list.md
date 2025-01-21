`blossom-audit list`
====================

Audit listing a public keys blobs on a server

* [`blossom-audit list SERVER PUBKEY`](#blossom-audit-list-server-pubkey)

## `blossom-audit list SERVER PUBKEY`

Audit listing a public keys blobs on a server

```
USAGE
  $ blossom-audit list SERVER PUBKEY [-v] [--sec <value>] [--connect <value>]

ARGUMENTS
  SERVER  The URL of the blossom server
  PUBKEY  The pubkey to use when fetching the list of blobs

FLAGS
  -v, --verbose          Enable verbose logging
      --connect=<value>  A NIP-46 bunker URI that will be used to sign authorization events
      --sec=<value>      A private key that will be used to sign authorization events

DESCRIPTION
  Audit listing a public keys blobs on a server
```

_See code: [src/commands/list.ts](https://github.com/hzrd149/blossom-audit/blob/v0.1.0/src/commands/list.ts)_
