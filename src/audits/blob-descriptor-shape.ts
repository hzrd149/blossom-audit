import { fail, info, pass, warn } from "../audit.js";
import { BLOSSOM_NIP94_DOCS, NIP94_DOCS } from "../const.js";
import { BlobDescriptor } from "../types.js";

export async function* blobDescriptorShapeAudit(_ctx: any, blob: Record<string, any>) {
  // check url
  if (Reflect.has(blob, "url")) {
    // has url

    if (typeof Reflect.get(blob, "url") !== "string") yield fail('"url" is not a string');
    else {
      yield pass('"url" is a string');

      if (!URL.canParse(Reflect.get(blob, "url"))) yield fail(`"url" field is not a valid url`);
      else {
        yield pass(`"url" is a valid URL`);

        const url = new URL(blob.url);

        const ext = url.pathname.split(".").pop();
        if (ext) yield pass('"url" has file extension');
        else yield warn(`"url" missing file extension`);
      }
    }
  } else yield fail('Missing "url" field');

  // check size
  if (Reflect.has(blob, "size")) {
    if (typeof Reflect.get(blob, "size") === "number") yield pass('"size" is a number');
    else yield fail(`"size" is not a number`);
  } else yield fail('Missing "size" field');

  // check type
  if (Reflect.has(blob, "type")) {
    if (typeof blob.type) yield pass(`"type" is a string`);
    else yield fail(`"type" must be a MIME type string`);
  } else yield warn(`Missing "type" field`);

  // check uploaded
  if (Reflect.has(blob, "uploaded")) {
    if (typeof Reflect.get(blob, "uploaded") === "number") yield pass(`"uploaded" is a number`);
    else yield fail(`"uploaded" is not a number`);
  } else yield fail('Missing "uploaded" field');

  // check legacy fields
  if (Reflect.has(blob, "created_at")) {
    yield warn({
      summary: `Has legacy "created_at" field`,
      description: `The created_at field should be renamed to uploaded`,
    });
  }

  if (Reflect.has(blob, "nip94")) {
    yield pass({ summary: `Has "nip94" metadata tags` });

    // required "url" tag
    if (Reflect.has(blob.nip94, "url")) {
      yield pass('Has NIP-94 "url" tag');
      if (blob.url && blob.nip94.url !== blob.url) yield warn(`NIP-94 "url" tag does not match blobs "url"`);
    } else yield fail({ summary: `'NIP-94 requires a "url" tag`, see: NIP94_DOCS });

    // required "m" tag
    if (Reflect.has(blob.nip94, "m")) {
      yield pass('Has NIP-94 "m" tag');
      if (blob.type && blob.nip94.m !== blob.type) yield warn(`NIP-94 "m" tag does not match blobs "type"`);
    } else yield fail({ summary: `'NIP-94 requires a "m" tag`, see: NIP94_DOCS });

    // required "x" tag
    if (Reflect.has(blob.nip94, "x")) {
      yield pass('Has NIP-94 "x" tag');
      if (blob.sha256 && blob.nip94.x !== blob.sha256) yield fail(`NIP-94 "x" tag does not match blobs "sha256"`);
    } else yield fail({ summary: `'NIP-94 requires a "x" tag`, see: NIP94_DOCS });

    // check size is equal
    if (blob.size && Reflect.has(blob.nip94, "size") && parseInt(blob.nip94.size) !== blob.size) {
      yield warn(`NIP-94 "size" tag does not match blobs "size"`);
    }

    // log any additional tags
    const requiredNip94Tags = ["x", "m", "url"];
    for (const [name, value] of Object.entries(blob.nip94)) {
      if (!requiredNip94Tags.includes(name)) {
        yield info({
          summary: `Has NIP-94 "${name}" tag`,
          description: `Value: ${value}`,
        });
      }
    }
  } else
    yield info({
      summary: `Missing NIP-94 tags`,
      description: `NIP-94 tags can be useful for nostr clients attaching images and videos to short text notes`,
      see: BLOSSOM_NIP94_DOCS,
    });

  // check for any unknown fields
  const knownFields = ["url", "size", "sha256", "type", "uploaded", "nip94"];
  for (const field of Reflect.ownKeys(blob)) {
    if (typeof field === "string" && !knownFields.includes(field)) {
      const value = Reflect.get(blob, field);

      if (value !== undefined) {
        yield info({
          summary: `Has unknown "${field}" field`,
          description: `Field: ${field}\nType: ${typeof value}\nValue: ${value}`,
        });
      }
    }
  }

  return blob as BlobDescriptor;
}
