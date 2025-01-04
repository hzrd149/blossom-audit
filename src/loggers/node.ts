import chalk from "chalk";
import terminalLink from "terminal-link";

import { HookSet } from "../audit.js";

export const NodeLogger: HookSet = {
  onGroupStart: (group) => console.group(chalk.bold(group.summary)),
  onGroupEnd: () => console.groupEnd(),
  onResult: (item) => {
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
  },
};
