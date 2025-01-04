import { group, info, pass } from "../audit.js";
import { getBlobSha256 } from "../helpers/blob.js";
import { errorResponseAudit } from "./error-response.js";

export async function* mediaUploadCheckAudit(ctx: { server: string }, blob: Blob) {
  const endpoint = new URL("/media", ctx.server);
  const hash = await getBlobSha256(blob);

  // BUD-05 check
  const check = await fetch(endpoint, {
    method: "HEAD",
    headers: {
      "X-Content-Length": String(blob.size),
      "X-Content-Type": blob.type,
      "X-SHA-256": hash,
    },
  });

  // check if supported
  if (check.status === 404) {
    yield info({
      summary: "BUD-05 media uploads not supported",
      see: "https://github.com/hzrd149/blossom/blob/master/buds/05.md",
    });

    // exit
    return;
  }

  if (!check.ok) {
    yield* group("Error Response", errorResponseAudit(ctx, check));
  } else yield pass(`Media upload check`);

  return check;
}
