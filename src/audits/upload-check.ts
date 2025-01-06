import { group, info, pass } from "../audit.js";
import { getBlobSha256 } from "../helpers/blob.js";
import { fetchWithLogs } from "../helpers/debug.js";
import { errorResponseAudit } from "./error-response.js";

export async function* uploadCheckAudit(ctx: { server: string }, blob: Blob) {
  const endpoint = new URL("/upload", ctx.server);
  const hash = await getBlobSha256(blob);

  // BUD-06 check
  const check = await fetchWithLogs(endpoint, {
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
      summary: "BUD-06 upload check is not supported",
      see: "https://github.com/hzrd149/blossom/blob/master/buds/06.md",
    });

    // exit
    return;
  }

  yield pass("BUD-06 upload check supported");

  if (!check.ok) {
    yield* group("Error Response", errorResponseAudit(ctx, check));
  }

  return check;
}
