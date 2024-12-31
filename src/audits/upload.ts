import { fail, group, pass } from "../audit";
import { getBlobSha256 } from "../helpers/blob";
import { blobDescriptorShapeAudit } from "./blob-descriptor-shape";
import { corsResponseHeadersAudit } from "./cors-response-headers";
import { endpointCorsHeadersAudit } from "./endpoint-cors-headers";
import { errorResponseAudit } from "./error-response";
import { uploadCheckAudit } from "./upload-check";

export async function* uploadAudit(ctx: { server: string }, blob: Blob) {
  const endpoint = new URL("/upload", ctx.server);

  // check cors headers
  yield await group("Check CORS", endpointCorsHeadersAudit(ctx, "/upload"));

  // BUD-06 check
  yield await group("Upload Check", uploadCheckAudit(ctx, blob));

  const sha256 = await getBlobSha256(blob);
  console.log(`calculated hash ${sha256}`);

  const upload = await fetch(endpoint, { method: "PUT", headers: { "x-sha256": sha256 } });

  // audit CORS headers
  yield await group("CORS Headers", corsResponseHeadersAudit(ctx, upload.headers));

  if (upload.ok) {
    console.log("Upload success");

    // check headers
    if (!upload.headers.has("content-type")) yield fail("Response missing Content-Type header");
    else if (upload.headers.get("content-type")!.startsWith("application/json"))
      yield pass("Content-Type is application/json");
    else yield fail("Content-Type is not application/json");

    // parse response body
    let result: any;
    try {
      result = await upload.json();
    } catch (error) {
      yield fail({
        summary: "Response body is not valid JSON",
        description: String(error),
        see: "https://github.com/hzrd149/blossom/blob/master/buds/02.md#put-upload---upload-blob",
      });

      return; // abort
    }

    // check blob descriptor
    yield await group("Blob Descriptor", blobDescriptorShapeAudit(ctx, result));
  } else {
    console.log(`Upload failed ${upload.status}: ${upload.headers.get("x-reason")}`);

    yield await group("Error Response", errorResponseAudit(ctx, upload));
  }
}
