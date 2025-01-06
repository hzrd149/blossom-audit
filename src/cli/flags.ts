import { Flags } from "@oclif/core";

export const globalFlags = {
  verbose: Flags.boolean({
    char: "v",
    default: false,
    description: "Enable verbose logging",
  }),
};
