import { Args, Command } from "@oclif/core";

import { audit, group, hooks } from "../audit.js";
import { NodeLogger } from "../loggers/node.js";
import { loadExampleFile } from "../helpers/cli.js";
import { fullAudit } from "../audits/full-audit.js";
import { globalFlags } from "../cli/flags.js";
import { debug } from "../helpers/debug.js";

export default class Audit extends Command {
  static flags = { ...globalFlags };
  static args = {
    server: Args.string({ description: "The URL of the blossom server", required: true }),
    file: Args.string({
      description: 'A path to a local file to upload. or "bitcoin" to use the built-in example file',
      required: true,
    }),
  };

  static description = "Run a full upload / download audit on a server";

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Audit);
    debug.enabled = flags.verbose;

    const server = new URL("/", args.server).toString();
    const file = await loadExampleFile(args.file);

    hooks.push(NodeLogger);
    await audit(group(`Full Audit ${server}`, fullAudit({ server }, file)));
  }
}
