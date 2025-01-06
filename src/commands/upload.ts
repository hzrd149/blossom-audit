import { Args, Command } from "@oclif/core";

import { loadExampleFile } from "../helpers/cli.js";
import { audit, group, hooks } from "../audit.js";
import { uploadBlobAudit } from "../audits/upload-blob.js";
import { NodeLogger } from "../loggers/node.js";
import { globalFlags } from "../cli/flags.js";
import { debug } from "../helpers/debug.js";

export default class Upload extends Command {
  static flags = {
    ...globalFlags,
  };
  static args = {
    server: Args.string({ description: "The URL of the server to upload to", required: true }),
    file: Args.string({
      description: 'A path to a local file to upload. or "bitcoin" to use the built-in example file',
      required: true,
    }),
  };

  static description = "Audit uploading a blob to a server";

  async run(): Promise<any> {
    const { args, flags } = await this.parse(Upload);
    debug.enabled = flags.verbose;

    const server = new URL("/", args.server).toString();
    const blob = await loadExampleFile(args.file);

    hooks.push(NodeLogger);
    await audit(group(`Upload ${args.file} to ${args.server}`, uploadBlobAudit({ server }, blob)));
  }
}
