import { fail, group, pass, warn } from "../audit.js";
import { BLOSSOM_MEDIA_UPLOAD_DOCS } from "../const.js";
import { getBlobSha256 } from "../helpers/blob.js";
import { fetchWithLogs } from "../helpers/debug.js";
import { blobDescriptorShapeAudit } from "./blob-descriptor-shape.js";
import { errorResponseAudit } from "./error-response.js";
import { mediaUploadCheckAudit } from "./media-upload-check.js";
import { responseCorsHeadersAudit } from "./response-cors-headers.js";

export async function* mediaUploadAudit(ctx: { server: string }, blob: Blob) {
  const endpoint = new URL("/media", ctx.server);
  const check = yield* group("Check media upload", mediaUploadCheckAudit(ctx, blob));

  if (!check || check?.status === 404) throw new Error("BUD-05 /media endpoint is not supported");

  const sha256 = await getBlobSha256(blob);
  const upload = await fetchWithLogs(endpoint, { body: blob, method: "PUT", headers: { "X-SHA-256": sha256 } });

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
  } else {
    yield* group("Error Response", errorResponseAudit(ctx, upload));
  }
}
