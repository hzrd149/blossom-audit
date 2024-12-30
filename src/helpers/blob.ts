import { bytesToHex } from "@noble/hashes/utils";

export const BlobHashSymbol = Symbol.for("sha256");

/** gets or calculates the sha2456 of a Blob */
export function getBlobSha256(blob: Blob) {
  if (Reflect.has(blob, BlobHashSymbol)) return Reflect.get(blob, BlobHashSymbol) as string;

  return computeBlobSha256(blob).then((hash) => {
    Reflect.set(blob, BlobHashSymbol, hash);
    return hash;
  });
}

/** Calculates the sha2456 of a Blob */
export async function computeBlobSha256(blob: Blob) {
  let buffer = await blob.arrayBuffer();

  let hash: Uint8Array;
  if (crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    hash = new Uint8Array(hashBuffer);
  } else {
    const { sha256 } = await import("@noble/hashes/sha256");
    hash = sha256.create().update(new Uint8Array(buffer)).digest();
  }

  return bytesToHex(hash);
}
