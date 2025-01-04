import { HookSet } from "../audit.js";

export const BrowserLogger: HookSet = {
  onGroupStart: (group) => console.group(group.summary),
  onGroupEnd: () => console.groupEnd(),
  onResult: (item) => {
    let icon = "";
    switch (item.type) {
      case "pass":
        icon = "✅";
        break;
      case "fail":
        icon = "❌";
        break;
      case "warn":
        icon = "🟠";
        break;
      case "info":
        icon = "🔵";
        break;
      case "error":
        icon = "⚠";
        break;
    }

    const line = icon + " " + item.summary;
    const desc = (item.description ? item.description : "") + (item.see ? " " + item.see : "");

    if (desc) console.log(line + "\n" + desc);
    else console.log(line);
  },
};
