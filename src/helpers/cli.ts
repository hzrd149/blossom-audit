import pfs from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import mime from "mime";

export async function readFileAsBlob(file: string) {
  const buffer = await pfs.readFile(file);
  return new Blob([buffer], { type: mime.getType(file) ?? undefined });
}

export async function readBuiltinFileAsBlob(filePath: string) {
  // Read the file as a buffer
  const file = resolve(dirname(fileURLToPath(import.meta.url)), "../../", filePath);
  const buffer = await pfs.readFile(file);

  // Convert buffer to Blob
  return new Blob([buffer], { type: mime.getType(file) ?? undefined });
}

export async function loadExampleFile(file: string) {
  switch (file) {
    case "bitcoin":
      return await readBuiltinFileAsBlob("assets/bitcoin.pdf");
    case "video-480":
      console.log("Downloading Big Buck Bunny 720p...");
      return await fetch("https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_480p_h264.mov").then(
        (res) => res.blob(),
      );
    case "video-720":
      console.log("Downloading Big Buck Bunny 720p...");
      return await fetch("https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_720p_h264.mov").then(
        (res) => res.blob(),
      );
    case "video-1080":
      console.log("Downloading Big Buck Bunny 1080p...");
      return await fetch("https://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_1080p_h264.mov").then(
        (res) => res.blob(),
      );
    case "gif":
      return await readBuiltinFileAsBlob("assets/waiting-alone-lonely.gif");
    case "image":
      // throw new error, missing test image
      return await readBuiltinFileAsBlob(
        "assets/npub17amtesfzwxl8nlr3ke2l8jl7kw52z60n8msnxh7vps3g9xgpmf9qx5nldk-image.jpg",
      );
    default:
      return await readFileAsBlob(file);
  }
}
