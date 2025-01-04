import { Args, Command } from "@oclif/core";

import { readBuiltinFileAsBlob, readFileAsBlob } from "../helpers/file.js";
import { audit, group, hooks } from "../audit.js";
import { NodeLogger } from "../loggers/node.js";
import { mediaUploadAudit } from "../audits/media-upload.js";

export default class MediaUpload extends Command {
  static args = {
    server: Args.string({ description: "The URL of the server to upload to", required: true }),
    file: Args.string({
      description:
        'A path to a local media file to upload. or "gif", "image", "video-720", "video-1080" to use the built-in example file',
      required: true,
    }),
  };

  async run(): Promise<any> {
    const { args } = await this.parse(MediaUpload);

    const server = new URL("/", args.server).toString();

    let blob: Blob;
    switch (args.file) {
      case "video-480":
        console.log("Downloading Big Buck Bunny 720p...");
        blob = await fetch("https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_480p_h264.mov").then(
          (res) => res.blob(),
        );
        break;
      case "video-720":
        console.log("Downloading Big Buck Bunny 720p...");
        blob = await fetch("https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_720p_h264.mov").then(
          (res) => res.blob(),
        );
        break;
      case "video-1080":
        console.log("Downloading Big Buck Bunny 1080p...");
        blob = await fetch("https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_1080p_h264.mov").then(
          (res) => res.blob(),
        );
        break;
      case "gif":
        blob = await readBuiltinFileAsBlob("assets/waiting-alone-lonely.gif");
        break;
      case "image":
        // throw new error, missing test image
        blob = await readBuiltinFileAsBlob(
          "assets/npub17amtesfzwxl8nlr3ke2l8jl7kw52z60n8msnxh7vps3g9xgpmf9qx5nldk-image.jpg",
        );
        break;
      default:
        blob = await readFileAsBlob(args.file);
        break;
    }

    hooks.push(NodeLogger);
    await audit(group(`Upload ${args.file} to ${args.server}`, mediaUploadAudit({ server }, blob)));
  }
}
