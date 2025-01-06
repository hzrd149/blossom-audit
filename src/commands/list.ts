import { Args, Command } from "@oclif/core";

import { audit, group, hooks } from "../audit.js";
import { NodeLogger } from "../loggers/node.js";
import { globalFlags } from "../cli/flags.js";
import { debug } from "../helpers/debug.js";
import { listAudit } from "../audits/list-audit.js";
import { normalizeToHexPubkey } from "../helpers/cli.js";

export default class List extends Command {
  static flags = { ...globalFlags };
  static args = {
    server: Args.string({ description: "The URL of the blossom server", required: true }),
    pubkey: Args.string({ description: "The pubkey to use when fetching the list of blobs", required: true }),
  };

  static description = "Audit listing a public keys blobs on a server";

  async run(): Promise<void> {
    const { args, flags } = await this.parse(List);
    debug.enabled = flags.verbose;

    const server = new URL("/", args.server).toString();

    hooks.push(NodeLogger);
    await audit(group(`List blobs for ${args.pubkey}`, listAudit({ server }, normalizeToHexPubkey(args.pubkey))));
  }
}
