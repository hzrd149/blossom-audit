`blossom-audit media-upload`
============================

Audit uploading a media file to the /media endpoint of a server

* [`blossom-audit media-upload SERVER FILE`](#blossom-audit-media-upload-server-file)

## `blossom-audit media-upload SERVER FILE`

Audit uploading a media file to the /media endpoint of a server

```
USAGE
  $ blossom-audit media-upload SERVER FILE [-v] [--sec <value>] [--connect <value>]

ARGUMENTS
  SERVER  The URL of the server to upload to
  FILE    A path to a local media file to upload. or "gif", "image", "video-720", "video-1080" to use the built-in
          example file

FLAGS
  -v, --verbose          Enable verbose logging
      --connect=<value>  A NIP-46 bunker URI that will be used to sign authorization events
      --sec=<value>      A private key that will be used to sign authorization events

DESCRIPTION
  Audit uploading a media file to the /media endpoint of a server
```

_See code: [src/commands/media-upload.ts](https://github.com/hzrd149/blossom-audit/blob/v0.1.0/src/commands/media-upload.ts)_
