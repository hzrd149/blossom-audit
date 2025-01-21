import { group, info, Result } from "../audit.js";
import { AUTH_EVENT_KIND } from "../const.js";
import { encodeAuthorizationHeader } from "../helpers/auth.js";
import { oneHour, unixNow } from "../helpers/date.js";
import { fetchWithLogs, verbose } from "../helpers/debug.js";
import { getHashFromURL } from "../helpers/url.js";
import { authenticationResponseAudit } from "./authentication-response.js";
import { SingerContext } from "./context.js";
import { errorResponseAudit } from "./error-response.js";

export async function* downloadCheckAudit(
  ctx: { server?: string } & SingerContext,
  url: string | URL,
): AsyncGenerator<Result, { pass?: boolean; auth?: boolean }> {
  if (typeof url === "string") {
    if (URL.canParse(url)) url = new URL(url);
    else if (ctx.server) url = new URL(url, ctx.server);
    else throw new Error("Missing server");
  }

  const hash = getHashFromURL(url, true);
  let response = await fetchWithLogs(url, { method: "HEAD" });

  // check error response
  if (!response.ok) yield* group("Error Response", errorResponseAudit(ctx, response));

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
          ["t", "get"],
          ["x", hash],
          ["expiration", String(oneHour())],
        ],
        created_at: unixNow(),
      });

      // retry with auth
      verbose("Retrying with authorization");
      response = await fetchWithLogs(url, {
        method: "HEAD",
        headers: { Authorization: encodeAuthorizationHeader(auth) },
      });

      if (!response.ok) yield* group("Error Response", errorResponseAudit(ctx, response));

      return { pass: response.ok, auth: true };
    } else {
      yield info(`Got ${response.status} (${response.statusText}) but missing signer`);

      return { pass: false };
    }
  }

  return { pass: response.ok };
}
