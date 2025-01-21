import { fail, group, info, pass, warn } from "../audit.js";
import { AUTH_EVENT_KIND } from "../const.js";
import { encodeAuthorizationHeader } from "../helpers/auth.js";
import { oneHour, unixNow } from "../helpers/date.js";
import { fetchWithLogs, verbose } from "../helpers/debug.js";
import { BlobDescriptor } from "../types.js";
import { blobDescriptorShapeAudit } from "./blob-descriptor-shape.js";
import { SingerContext } from "./context.js";
import { endpointCorsHeadersAudit } from "./endpoint-cors-headers.js";
import { errorResponseAudit } from "./error-response.js";
import { responseCorsHeadersAudit } from "./response-cors-headers.js";

export async function* listAudit(ctx: { server: string } & SingerContext, pubkey: string) {
  const endpoint = new URL("/list/" + pubkey, ctx.server);

  yield* group("CORS preflight", endpointCorsHeadersAudit(ctx, endpoint));

  // TODO: support since and until params
  let response = await fetchWithLogs(endpoint);

  // check CORS headers
  yield* group("CORS Headers", responseCorsHeadersAudit(ctx, response.headers));

  // check error response
  if (!response.ok) yield* group("Error response", errorResponseAudit(ctx, response));

  if (response.status === 401) {
    if (ctx.signer) {
      verbose(`Creating list authorization event`);
      const auth = await ctx.signer.signEvent({
        kind: AUTH_EVENT_KIND,
        content: "upload audit",
        tags: [
          ["t", "list"],
          ["expiration", String(oneHour())],
        ],
        created_at: unixNow(),
      });

      // retry with auth
      verbose("Retrying with authorization");
      response = await fetchWithLogs(endpoint, {
        method: "GET",
        headers: { Authorization: encodeAuthorizationHeader(auth) },
      });

      if (!response.ok) yield* group("Error Response", errorResponseAudit(ctx, response));

      // check CORS headers
      yield* group("CORS Headers", responseCorsHeadersAudit(ctx, response.headers));
    } else {
      yield warn("Authentication is required but missing signer");

      return;
    }
  }

  if (response.ok) {
    // check headers
    if (!response.headers.has("content-type")) yield fail("Response missing Content-Type header");
    else if (response.headers.get("content-type")!.startsWith("application/json"))
      yield pass("Content-Type is application/json");
    else yield fail("Content-Type is not application/json");

    // parse response body
    try {
      const result = await response.json();

      verbose("Got json response", result);

      if (Array.isArray(result)) {
        const arr = result as BlobDescriptor[];
        yield pass(`Response body is an array (${arr.length})`);

        const checkItems = Math.min(arr.length, 10);
        yield info(`Checking ${checkItems} items in array`);
        for (let i = 0; i < checkItems; i++) {
          const blob = arr[i];
          yield* group(`Blob ${i}/${arr.length - 1}`, blobDescriptorShapeAudit(ctx, blob));
        }

        return result as BlobDescriptor[];
      } else
        yield fail({
          summary: "Response body must be a json array",
          see: "https://github.com/hzrd149/blossom/blob/master/buds/02.md#get-listpubkey---list-blobs-optional",
        });
    } catch (error) {
      yield fail({
        summary: "Response body is not valid JSON",
        description: String(error),
        see: "https://github.com/hzrd149/blossom/blob/master/buds/02.md#get-listpubkey---list-blobs-optional",
      });
    }
  }
}
