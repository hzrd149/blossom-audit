import { fail, group, pass, Result } from "../audit.js";
import { getBlobSha256 } from "../helpers/blob.js";
import { blobDescriptorShapeAudit } from "./blob-descriptor-shape.js";
import { responseCorsHeadersAudit } from "./response-cors-headers.js";
import { endpointCorsHeadersAudit } from "./endpoint-cors-headers.js";
import { errorResponseAudit } from "./error-response.js";
import { uploadCheckAudit } from "./upload-check.js";
import { BlobDescriptor } from "../types.js";
import { fetchWithLogs } from "../helpers/debug.js";

export async function* uploadBlobAudit(
  ctx: { server: string },
  blob: Blob,
): AsyncGenerator<Result, BlobDescriptor | undefined> {
  const endpoint = new URL("/upload", ctx.server);

  // check cors headers
  yield* group("Check CORS", endpointCorsHeadersAudit(ctx, "/upload"));

  // BUD-06 check
  const check = yield* group("Upload Check", uploadCheckAudit(ctx, blob));

  // don't continue the upload if the check failed
  if (check && !check.ok && check.status !== 404) throw new Error("Upload check failed");

  const sha256 = await getBlobSha256(blob);
  const upload = await fetchWithLogs(endpoint, { method: "PUT", headers: { "X-SHA-256": sha256 }, body: blob });

  // audit CORS headers
  yield* group("CORS Response Headers", responseCorsHeadersAudit(ctx, upload.headers));

  if (upload.ok) {
    // check headers
    if (!upload.headers.has("content-type")) yield fail("Response missing Content-Type header");
    else if (upload.headers.get("content-type")!.startsWith("application/json"))
      yield pass("Content-Type is application/json");
    else yield fail("Content-Type is not application/json");

    // parse response body
    try {
      const result = await upload.json();

      // check blob descriptor
      const descriptor = yield* group("Blob Descriptor", blobDescriptorShapeAudit(ctx, result));

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
  } else {
    yield* group("Error Response", errorResponseAudit(ctx, upload));
  }
}
