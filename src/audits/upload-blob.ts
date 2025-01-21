import { fail, group, info, pass, Result, warn } from "../audit.js";
import { getBlobSha256 } from "../helpers/blob.js";
import { blobDescriptorShapeAudit } from "./blob-descriptor-shape.js";
import { responseCorsHeadersAudit } from "./response-cors-headers.js";
import { endpointCorsHeadersAudit } from "./endpoint-cors-headers.js";
import { errorResponseAudit } from "./error-response.js";
import { uploadCheckAudit } from "./upload-check.js";
import { BlobDescriptor } from "../types.js";
import { fetchWithLogs, verbose } from "../helpers/debug.js";
import { SingerContext } from "./context.js";
import { AUTH_EVENT_KIND } from "../const.js";
import { oneHour, unixNow } from "../helpers/date.js";
import { encodeAuthorizationHeader } from "../helpers/auth.js";
import { authenticationResponseAudit } from "./authentication-response.js";

export async function* uploadRequest(
  ctx: { server: string } & SingerContext,
  blob: Blob,
  useAuth?: boolean,
): AsyncGenerator<Result, Response | undefined> {
  const endpoint = new URL("/upload", ctx.server);
  const sha256 = await getBlobSha256(blob);

  let upload: Response;
  if (useAuth) {
    if (!ctx.signer) throw new Error("Missing signer");

    verbose(`Creating upload authorization event`);

    const auth = await ctx.signer.signEvent({
      kind: AUTH_EVENT_KIND,
      tags: [
        ["t", "upload"],
        ["x", sha256],
        ["expiration", String(oneHour())],
      ],
      content: "upload audit",
      created_at: unixNow(),
    });

    upload = await fetchWithLogs(endpoint, {
      method: "PUT",
      headers: { "X-SHA-256": sha256, Authorization: encodeAuthorizationHeader(auth) },
      body: blob,
    });

    if (upload.status === 401)
      throw new Error(`Returned ${upload.status} (${upload.statusText}) even though Authorization header was provided`);
  } else {
    upload = await fetchWithLogs(endpoint, { method: "PUT", headers: { "X-SHA-256": sha256 }, body: blob });
  }

  // audit CORS headers
  yield* group("CORS Response Headers", responseCorsHeadersAudit(ctx, upload.headers));

  // check error response
  if (!upload.ok) {
    yield* group("Error Response", errorResponseAudit(ctx, upload));
  }

  // 401 auth required
  if (upload.status === 401) {
    // check authentication response
    yield* authenticationResponseAudit(ctx, upload);

    if (ctx.signer) {
      yield info(`Got ${upload.status} (${upload.statusText}) retrying with auth`);

      return yield* uploadRequest(ctx, blob, true);
    } else {
      yield warn(`Got ${upload.status} (${upload.statusText}) but missing signer`);

      return undefined;
    }
  }

  return upload;
}

export async function* uploadBlobAudit(
  ctx: { server: string } & SingerContext,
  blob: Blob,
): AsyncGenerator<Result, BlobDescriptor | undefined> {
  // check cors headers
  yield* group("CORS preflight", endpointCorsHeadersAudit(ctx, "/upload"));

  // BUD-06 check
  const check = yield* group("Upload Check", uploadCheckAudit(ctx, blob));

  // don't continue the upload if the check failed
  if (check && check.pass === false) throw new Error("Upload check failed");

  const sha256 = await getBlobSha256(blob);

  const response = yield* uploadRequest(ctx, blob, check?.auth);
  if (!response) throw new Error("Failed to get upload response");

  if (response.ok) {
    // check headers
    if (!response.headers.has("content-type")) yield fail("Response missing Content-Type header");
    else if (response.headers.get("content-type")!.startsWith("application/json"))
      yield pass("Content-Type is application/json");
    else yield fail("Content-Type is not application/json");

    try {
      // parse response body
      const json = (await response.json()) as Record<string, any>;

      const descriptor = yield* group("Blob Descriptor", blobDescriptorShapeAudit(ctx, json));
      if (!descriptor) throw new Error("Failed to get blob descriptor");

      if (descriptor.sha256 === sha256) yield pass("sha256 hash matches");
      else
        yield fail({
          summary: "Returned hash does not match original blob",
          description: `Original: ${sha256}\nReturned: ${descriptor.sha256}`,
        });

      if (descriptor.size === blob.size) yield pass("Returned size matches blob size");
      else
        yield fail({
          summary: "Returned size does not match original blob size",
          description: `Original: ${blob.size}]\nReturned: ${descriptor.size}`,
        });

      if (descriptor.type) {
        if (descriptor.type === blob.type) yield pass(`Returned MIME type matches`);
        else
          yield fail({
            summary: `Returned MIME type does not match original blob`,
            description: `Original: ${blob.type}\nReturned: ${descriptor.type}`,
          });
      }

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
