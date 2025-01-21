import { fail, group, info, pass, Result, warn } from "../audit.js";
import { getBlobSha256 } from "../helpers/blob.js";
import { responseCorsHeadersAudit } from "./response-cors-headers.js";
import { downloadCheckAudit } from "./download-check.js";
import { endpointCorsHeadersAudit } from "./endpoint-cors-headers.js";
import { getHashFromURL } from "../helpers/url.js";
import { fetchWithLogs, verbose } from "../helpers/debug.js";
import { SingerContext } from "./context.js";
import { errorResponseAudit } from "./error-response.js";
import { AUTH_EVENT_KIND } from "../const.js";
import { oneHour, unixNow } from "../helpers/date.js";
import { encodeAuthorizationHeader } from "../helpers/auth.js";
import { authenticationResponseAudit } from "./authentication-response.js";

async function* downloadRequest(
  ctx: { server?: string } & SingerContext,
  url: URL,
  hash: string,
  useAuth?: boolean,
): AsyncGenerator<Result, Response | undefined> {
  let response: Response;

  if (useAuth) {
    if (ctx.signer) {
      verbose(`Creating get authorization event`);
      const auth = await ctx.signer.signEvent({
        kind: AUTH_EVENT_KIND,
        content: "download audit",
        tags: [
          ["t", "get"],
          ["x", hash],
          ["expiration", String(oneHour())],
        ],
        created_at: unixNow(),
      });

      // retry with auth
      response = await fetchWithLogs(url, {
        method: "GET",
        headers: { Authorization: encodeAuthorizationHeader(auth) },
      });

      if (response.status === 401)
        yield fail(
          `Returned ${response.status} (${response.statusText}) even though Authorization header was provided`,
        );
    } else {
      yield warn("Authentication is required but missing signer");
      return;
    }
  } else {
    response = await fetchWithLogs(url);
  }

  // audit CORS headers
  yield* group("CORS Headers", responseCorsHeadersAudit(ctx, response.headers));

  // check error response
  if (!response.ok) yield* group("Error Response", errorResponseAudit(ctx, response));

  // 401 auth required
  if (response.status === 401) {
    yield* authenticationResponseAudit(ctx, response);

    yield info(`Got ${response.status} (${response.statusText}) retrying with auth`);

    return yield* downloadRequest(ctx, url, hash, true);
  }

  return response;
}

export async function* downloadBlobAudit(ctx: { server?: string } & SingerContext, url: string | URL) {
  if (typeof url === "string") {
    if (URL.canParse(url)) url = new URL(url);
    else if (ctx.server) url = new URL(url, ctx.server);
    else throw new Error("Invalid URL");
  }

  const hash = getHashFromURL(url, true);
  verbose(`Found ${hash} in ${url.toString()}`);

  yield* group("CORS preflight", endpointCorsHeadersAudit(ctx, url));

  const check = yield* group("Check Download", downloadCheckAudit(ctx, url));

  const response = yield* downloadRequest(ctx, url, hash, check?.auth);
  if (!response) throw new Error("Download failed");

  if (response.ok) {
    const blob = await response.blob();

    const sha256 = await getBlobSha256(blob);
    if (sha256 === hash) yield pass({ summary: `Downloaded blob matches hash`, description: sha256 });
    else
      yield fail({
        summary: "Downloaded blobs sha256 hash did not make requested hash",
        description: `The server is transforming the blob is some way or returning a completely different blob\nRequested ${hash} and got ${sha256}`,
      });

    return blob;
  }
}
