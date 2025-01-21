import { Args, Command } from "@oclif/core";

import { audit, group, hooks } from "../audit.js";
import { downloadBlobAudit } from "../audits/download-blob.js";
import { NodeLogger } from "../loggers/node.js";
import { connectFlag, globalFlags, secretKeyFlag } from "../cli/flags.js";
import { debug } from "../helpers/debug.js";
import { disconnectSigner, getAuthSigner } from "../helpers/cli.js";

export default class Download extends Command {
  static flags = {
    ...globalFlags,
    sec: secretKeyFlag,
    connect: connectFlag,
  };

  static args = {
    server: Args.string({ description: "The URL of the blossom server", required: true }),
    hash: Args.string({ description: "The sha256 hash of the blob to download" }),
  };

  static description = "Audit downloading a blob from a server";

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Download);
    debug.enabled = flags.verbose;

    const signer = await getAuthSigner(flags);
    const server = new URL("/", args.server).toString();
    const url = new URL(args.server).toString();

    hooks.push(NodeLogger);
    await audit(group(`Download audit`, downloadBlobAudit({ server, signer }, args.hash || url)));

    await disconnectSigner(signer);
  }
}
