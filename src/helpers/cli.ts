import pfs from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import mime from "mime";
import { nip19, SimplePool } from "nostr-tools";
import { hexToBytes } from "@noble/hashes/utils";
import { NostrConnectConnectionMethods, NostrConnectSigner, SimpleSigner } from "applesauce-signer";
import { SubCloser } from "nostr-tools/abstract-pool";

export const pool = new SimplePool();

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

export function normalizeToHexPubkey(hex: string) {
  if (hex.match(/[0-9a-f]{64}/i)) return hex;
  const result = nip19.decode(hex);
  switch (result.type) {
    case "naddr":
    case "nprofile":
      return result.data.pubkey;
    case "npub":
      return result.data;
    default:
      throw new Error(`Cant find pubkey in ${result.type}`);
  }
}

export function getSecretKeyHex(value: string) {
  if (/[0-9a-f]{64}/i.test(value)) return hexToBytes(value);
  else if (value.startsWith("nsec")) {
    const decode = nip19.decode(value);
    if (decode.type !== "nsec") throw new Error(`Unsupported secret key type ${decode.type}`);
    return decode.data;
  } else throw new Error("Unknown secret key");
}

function createConnectMethods(): NostrConnectConnectionMethods {
  let sub: SubCloser | undefined = undefined;

  return {
    onPublishEvent: async (event, relays) => {
      await pool.publish(relays, event);
    },
    onSubOpen: async (filters, relays, onevent) => {
      sub = pool.subscribeMany(relays, filters, { onevent });
    },
    onSubClose: async () => {
      sub?.close();
    },
  };
}

export async function getAuthSigner(flags: { sec?: string; connect?: string }) {
  if (flags.connect && flags.sec) {
    const key = getSecretKeyHex(flags.sec);
    const signer = new SimpleSigner(key);
    return await NostrConnectSigner.fromBunkerURI(flags.connect, { ...createConnectMethods(), signer });
  } else if (flags.connect) {
    return await NostrConnectSigner.fromBunkerURI(flags.connect, createConnectMethods());
  } else if (flags.sec) {
    const key = getSecretKeyHex(flags.sec);
    return new SimpleSigner(key);
  }
}
