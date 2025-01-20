import { group, info, pass, Result } from "../audit.js";
import { AUTH_EVENT_KIND } from "../const.js";
import { encodeAuthorizationHeader } from "../helpers/auth.js";
import { getBlobSha256 } from "../helpers/blob.js";
import { oneHour, unixNow } from "../helpers/date.js";
import { fetchWithLogs, verbose } from "../helpers/debug.js";
import { authenticationResponseAudit } from "./authentication-response.js";
import { SingerContext } from "./context.js";
import { errorResponseAudit } from "./error-response.js";

export async function* uploadCheckAudit(
  ctx: { server: string } & SingerContext,
  blob: Blob,
): AsyncGenerator<Result, { pass?: boolean; auth?: boolean }> {
  const endpoint = new URL("/upload", ctx.server);
  const hash = await getBlobSha256(blob);

  // BUD-06 check
  let response = await fetchWithLogs(endpoint, {
    method: "HEAD",
    headers: {
      "X-Content-Length": String(blob.size),
      "X-Content-Type": blob.type,
      "X-SHA-256": hash,
    },
  });

  if (!response.ok) {
    yield* group("Error Response", errorResponseAudit(ctx, response));
  }

  // check if supported
  if (response.status === 404) {
    yield info({
      summary: "BUD-06 upload check is not supported",
      see: "https://github.com/hzrd149/blossom/blob/master/buds/06.md",
    });

    // exit
    return {};
  } else {
    yield pass("BUD-06 upload check supported");
  }

  // handle 401 auth
  if (response.status === 401) {
    // check WWW-Authenticate header
    yield* authenticationResponseAudit(ctx, response);

    // retry if signer is present
    if (ctx.signer) {
      verbose(`Creating upload authorization event`);

      const auth = await ctx.signer.signEvent({
        kind: AUTH_EVENT_KIND,
        content: "upload audit",
        tags: [
          ["t", "upload"],
          ["x", hash],
          ["expiration", String(oneHour())],
        ],
        created_at: unixNow(),
      });

      // retry with auth
      verbose("Retrying with authorization");
      response = await fetchWithLogs(endpoint, {
        method: "HEAD",
        headers: {
          "X-Content-Length": String(blob.size),
          "X-Content-Type": blob.type,
          "X-SHA-256": hash,
          Authorization: encodeAuthorizationHeader(auth),
        },
      });

      if (!response.ok) {
        yield* group("Error Response", errorResponseAudit(ctx, response));
      }

      return { pass: response.ok, auth: true };
    } else {
      yield info(`Got ${response.status} (${response.statusText}) but missing signer`);

      return { pass: false };
    }
  }

  return { pass: response.ok };
}
