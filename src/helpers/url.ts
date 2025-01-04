import { Expressions } from "./regexp.js";

export function getHashFromURL(url: string | URL): string | undefined;
export function getHashFromURL(url: string | URL, required: false): string | undefined;
export function getHashFromURL(url: string | URL, required: true): string;
export function getHashFromURL(url: string | URL, required = false): string | undefined {
  if (typeof url === "string") url = new URL(url);

  const hashes = Array.from(url.pathname.matchAll(Expressions.sha256));
  if (hashes.length > 0) return hashes[hashes.length - 1][0];
  else if (required) throw new Error("Cant find hash in URL");
  else return undefined;
}
