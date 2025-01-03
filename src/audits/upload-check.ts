import { group, info } from "../audit.js";
import { getBlobSha256 } from "../helpers/blob.js";
import { responseCorsHeadersAudit } from "./response-cors-headers.js";
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

    // exit
    return;
  }

  // audit CORS headers
  yield* group("CORS Headers", responseCorsHeadersAudit(ctx, check.headers));

  if (!check.ok) {
    yield* group("Error Response", errorResponseAudit(ctx, check));
  }

  return check;
}
