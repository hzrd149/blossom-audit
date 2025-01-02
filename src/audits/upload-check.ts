import { group, info } from "../audit.js";
import { getBlobSha256 } from "../helpers/blob.js";
import { corsResponseHeadersAudit } from "./cors-response-headers.js";
import { errorResponseAudit } from "./error-response.js";

export async function* uploadCheckAudit(ctx: { server: string }, blob: Blob) {
  const endpoint = new URL("/upload", ctx.server);
  const hash = await getBlobSha256(blob);

  // BUD-06 check
  const check = await fetch(endpoint, {
    method: "HEAD",
    headers: {
      "x-content-length": String(blob.size),
      "x-content-type": blob.type,
      "x-sha256": hash,
    },
  });

  // check if supported
  if (check.status === 404) {
    yield info({
      summary: "BUD-06 upload check is not supported",
      see: "https://github.com/hzrd149/blossom/blob/master/buds/06.md",
    });

    console.log("HEAD endpoint not supported, skipping checks");

    // exit
    return;
  }

  // audit CORS headers
  yield* group("CORS Headers", corsResponseHeadersAudit(ctx, check.headers));

  if (check.ok) console.log("Upload check passed");
  else {
    console.log(`Check failed ${check.status}: ${check.headers.get("x-reason")}`);

    yield* group("Error Response", errorResponseAudit(ctx, check));
  }
}
