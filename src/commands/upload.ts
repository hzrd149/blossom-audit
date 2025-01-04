import { Args, Command } from "@oclif/core";

import { readBuiltinFileAsBlob, readFileAsBlob } from "../helpers/file.js";
import { audit, group, hooks } from "../audit.js";
import { uploadBlobAudit } from "../audits/upload-blob.js";
import { NodeLogger } from "../loggers/node.js";

export default class Upload extends Command {
  static args = {
    server: Args.string({ description: "The URL of the server to upload to", required: true }),
    file: Args.string({
      description: 'A path to a local file to upload. or "bitcoin" to use the built-in example file',
      required: true,
    }),
  };

  async run(): Promise<any> {
    const { args } = await this.parse(Upload);

    const server = new URL("/", args.server).toString();

    let blob: Blob;
    if (args.file === "bitcoin") blob = await readBuiltinFileAsBlob("assets/bitcoin.pdf");
    else blob = await readFileAsBlob(args.file);

    hooks.push(NodeLogger);
    await audit(group(`Upload ${args.file} to ${args.server}`, uploadBlobAudit({ server }, blob)));
  }
}
