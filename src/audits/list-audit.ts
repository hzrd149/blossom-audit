import { fail, group, info, pass } from "../audit.js";
import { fetchWithLogs, verbose } from "../helpers/debug.js";
import { BlobDescriptor } from "../types.js";
import { blobDescriptorShapeAudit } from "./blob-descriptor-shape.js";
import { endpointCorsHeadersAudit } from "./endpoint-cors-headers.js";
import { errorResponseAudit } from "./error-response.js";

export async function* listAudit(ctx: { server: string }, pubkey: string) {
  const url = new URL("/list/" + pubkey, ctx.server);

  yield* group("Check CORS", endpointCorsHeadersAudit(ctx, url));

  // TODO: support since and until params
  const list = await fetchWithLogs(url);

  if (list.ok) {
    // check headers
    if (!list.headers.has("content-type")) yield fail("Response missing Content-Type header");
    else if (list.headers.get("content-type")!.startsWith("application/json"))
      yield pass("Content-Type is application/json");
    else yield fail("Content-Type is not application/json");

    // parse response body
    try {
      const result = await list.json();

      verbose("Got json response", result);

      if (Array.isArray(result)) {
        const arr = result as BlobDescriptor[];
        yield pass("Response body is an array");

        yield info(`Checking all ${arr.length} items in array`);
        for (let i = 0; i < arr.length; i++) {
          const blob = arr[i];
          yield* group(`Blob ${i}/${arr.length - 1}`, blobDescriptorShapeAudit(ctx, blob));
        }
      } else
        yield fail({
          summary: "Response body must be a json array",
          see: "https://github.com/hzrd149/blossom/blob/master/buds/02.md#get-listpubkey---list-blobs-optional",
        });

      return result;
    } catch (error) {
      yield fail({
        summary: "Response body is not valid JSON",
        description: String(error),
        see: "https://github.com/hzrd149/blossom/blob/master/buds/02.md#get-listpubkey---list-blobs-optional",
      });
    }
  } else yield* group("Error response", errorResponseAudit(ctx, list));
}
