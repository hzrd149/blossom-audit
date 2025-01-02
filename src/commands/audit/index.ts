import { Args, Command, Flags } from "@oclif/core";
import chalk from "chalk";
import terminalLink from "terminal-link";

import { audit, group, hooks } from "../../audit.js";
import { uploadDownloadAudit } from "../../audits/upload-download.js";
import { readFileAsBlob } from "../../helpers/file.js";

export default class Hello extends Command {
  static args = {
    server: Args.string({ description: "The URL of the blossom server", required: true }),
  };

  static description = "Run a full audit on a server";

  //   static examples = [
  //     `<%= config.bin %> <%= command.id %> friend --from oclif
  // hello friend from oclif! (./src/commands/hello/index.ts)
  // `,
  //   ];

  static flags = {
    from: Flags.string({ char: "f", description: "Who is saying hello" }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(Hello);

    const server = new URL("/", args.server).toString();

    // setup hooks
    hooks.onGroupStart = (group) => console.group(chalk.bold(group.summary));
    hooks.onGroupEnd = () => console.groupEnd();
    hooks.onResult = (item) => {
      let icon = "";
      let color = chalk.green;
      switch (item.type) {
        case "pass":
          icon = "✅";
          color = chalk.green;
          break;
        case "fail":
          icon = "❌";
          color = chalk.red;
          break;
        case "warn":
          icon = "🟠";
          color = chalk.yellow;
          break;
        case "info":
          icon = "🔵";
          color = chalk.blue;
          break;
        case "error":
          icon = "⚠";
          color = chalk.red;
          break;
      }

      const line = icon + " " + color(item.summary);
      const desc =
        (item.description ? chalk.grey(item.description) : "") + (item.see ? " " + terminalLink("see", item.see) : "");

      if (desc) console.log(line + "\n" + desc);
      else console.log(line);
    };

    const blob = await readFileAsBlob("assets/bitcoin.pdf");

    // run audit
    await audit(group(server, uploadDownloadAudit({ server }, blob)));
  }
}
