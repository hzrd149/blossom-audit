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
