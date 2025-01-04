import { Args, Command } from "@oclif/core";

import { audit, group, hooks } from "../audit.js";
import { downloadBlobAudit } from "../audits/download-blob.js";
import { NodeLogger } from "../loggers/node.js";

export default class Download extends Command {
  static args = {
    server: Args.string({ description: "The URL of the blossom server", required: true }),
    hash: Args.string({ description: "The sha256 hash of the blob to download" }),
  };

  static description = "Audit downloading a blob from a server";

  async run(): Promise<void> {
    const { args } = await this.parse(Download);

    const server = new URL("/", args.server).toString();
    const url = new URL(args.server).toString();

    hooks.push(NodeLogger);
    await audit(group(`Download ${args.hash}`, downloadBlobAudit({ server }, args.hash || url)));
  }
}
