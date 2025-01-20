import { Flags } from "@oclif/core";

export const globalFlags = {
  verbose: Flags.boolean({
    char: "v",
    default: false,
    description: "Enable verbose logging",
  }),
};

export const secretKeyFlag = Flags.string({
  name: "sec",
  description: "A private key that will be used to sign authorization events",
});
export const connectFlag = Flags.string({
  name: "connect",
  description: "A NIP-46 bunker URI that will be used to sign authorization events",
});
