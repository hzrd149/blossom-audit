import { fail, group, info, pass, Result, warn } from "../audit.js";
import { AUTH_EVENT_KIND, BLOSSOM_MEDIA_UPLOAD_DOCS } from "../const.js";
import { encodeAuthorizationHeader } from "../helpers/auth.js";
import { getBlobSha256 } from "../helpers/blob.js";
import { oneHour, unixNow } from "../helpers/date.js";
import { fetchWithLogs, verbose } from "../helpers/debug.js";
import { authenticationResponseAudit } from "./authentication-response.js";
import { blobDescriptorShapeAudit } from "./blob-descriptor-shape.js";
import { SingerContext } from "./context.js";
import { errorResponseAudit } from "./error-response.js";
import { mediaUploadCheckAudit } from "./media-upload-check.js";
import { responseCorsHeadersAudit } from "./response-cors-headers.js";

async function* mediaUploadRequest(
  ctx: { server: string } & SingerContext,
  blob: Blob,
  useAuth?: boolean,
): AsyncGenerator<Result, Response | undefined> {
  const endpoint = new URL("/media", ctx.server);
  const sha256 = await getBlobSha256(blob);

  let response: Response;
  if (useAuth) {
    if (!ctx.signer) throw new Error("Missing signer");

    verbose(`Creating upload authorization event`);

    const auth = await ctx.signer.signEvent({
      kind: AUTH_EVENT_KIND,
      tags: [
        ["t", "media"],
        ["x", sha256],
        ["expiration", String(oneHour())],
      ],
      content: "upload audit",
      created_at: unixNow(),
    });

    response = await fetchWithLogs(endpoint, {
      method: "PUT",
      headers: { "X-SHA-256": sha256, Authorization: encodeAuthorizationHeader(auth) },
      body: blob,
    });

    if (response.status === 401)
      throw new Error(
        `Returned ${response.status} (${response.statusText}) even though Authorization header was provided`,
      );
  } else {
    response = await fetchWithLogs(endpoint, { method: "PUT", headers: { "X-SHA-256": sha256 }, body: blob });
  }

  // audit CORS headers
  yield* group("CORS Headers", responseCorsHeadersAudit(ctx, response.headers));

  // check error response
  if (!response.ok) yield* group("Error Response", errorResponseAudit(ctx, response));

  // 401 auth required
  if (response.status === 401) {
    yield* authenticationResponseAudit(ctx, response);

    if (ctx.signer) {
      yield info(`Got ${response.status} (${response.statusText}) retrying with auth`);

      return yield* mediaUploadRequest(ctx, blob, true);
    } else {
      yield warn(`Got ${response.status} (${response.statusText}) but missing signer`);

      return undefined;
    }
  }

  return response;
}

export async function* mediaUploadAudit(ctx: { server: string } & SingerContext, blob: Blob) {
  const check = yield* group("Check media upload", mediaUploadCheckAudit(ctx, blob));

  if (!check)
    yield fail({
      summary: "HEAD /media endpoint is not supported",
      description:
        "The /media endpoint must support HEAD requests to allow clients to check if their are allowed to upload specific types of media",
      see: "https://github.com/hzrd149/blossom/blob/master/buds/05.md#head-media",
    });

  const sha256 = await getBlobSha256(blob);
  const response = yield* mediaUploadRequest(ctx, blob, check?.auth);
  if (!response) throw new Error("Failed to get upload response");

  // audit CORS headers
  yield* group("CORS Response Headers", responseCorsHeadersAudit(ctx, response.headers));

  if (response.ok) {
    // check headers
    if (!response.headers.has("content-type")) yield fail("Response missing Content-Type header");
    else if (response.headers.get("content-type")!.startsWith("application/json"))
      yield pass("Content-Type is application/json");
    else yield fail("Content-Type is not application/json");

    // parse response body
    try {
      const json = (await response.json()) as Record<string, any>;

      // check blob descriptor
      const descriptor = yield* group("Blob Descriptor", blobDescriptorShapeAudit(ctx, json));
      if (!descriptor) throw new Error("Failed to get blob descriptor");

      if (descriptor.sha256 === sha256)
        yield warn({
          summary: "Server did not transform blob",
          description: "This could be an indication something is wrong with the /media endpoint on the server",
          see: BLOSSOM_MEDIA_UPLOAD_DOCS,
        });
      else
        yield pass({
          summary: "Server transformed blob",
          description: `Original: ${sha256}, ${blob.type}, ${blob.size}\nReturned: ${descriptor.sha256}, ${descriptor.type}, ${descriptor.size}`,
        });

      return descriptor;
    } catch (error) {
      yield fail({
        summary: "Response body is not valid JSON",
        description: String(error),
        see: "https://github.com/hzrd149/blossom/blob/master/buds/02.md#put-upload---upload-blob",
      });
    }
  }
}
