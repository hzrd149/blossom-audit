import { Args, Command } from "@oclif/core";

import { disconnectSigner, getAuthSigner, loadExampleFile } from "../helpers/cli.js";
import { audit, group, hooks } from "../audit.js";
import { NodeLogger } from "../loggers/node.js";
import { mediaUploadAudit } from "../audits/media-upload.js";
import { connectFlag, globalFlags, secretKeyFlag } from "../cli/flags.js";
import { debug } from "../helpers/debug.js";

export default class MediaUpload extends Command {
  static flags = {
    ...globalFlags,
    sec: secretKeyFlag,
    connect: connectFlag,
  };
  static args = {
    server: Args.string({ description: "The URL of the server to upload to", required: true }),
    file: Args.string({
      description:
        'A path to a local media file to upload. or "gif", "image", "video-720", "video-1080" to use the built-in example file',
      required: true,
    }),
  };

  static description = "Audit uploading a media file to the /media endpoint of a server";

  async run(): Promise<any> {
    const { args, flags } = await this.parse(MediaUpload);
    debug.enabled = flags.verbose;

    const signer = await getAuthSigner(flags);
    const server = new URL("/", args.server).toString();
    const blob: Blob = await loadExampleFile(args.file);

    hooks.push(NodeLogger);
    await audit(group(`Upload ${args.file} to ${args.server}`, mediaUploadAudit({ server, signer }, blob)));

    await disconnectSigner(signer);
  }
}
