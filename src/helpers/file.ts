import pfs from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

export async function readFileAsBlob(filePath: string) {
  // Read the file as a buffer
  const buffer = await pfs.readFile(resolve(dirname(fileURLToPath(import.meta.url)), "../../", filePath));

  // Convert buffer to Blob
  const blob = new Blob([buffer], { type: "application/octet-stream" });

  return blob;
}
