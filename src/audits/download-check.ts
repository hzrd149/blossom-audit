import { group } from "../audit.js";
import { corsResponseHeadersAudit } from "./cors-response-headers.js";
import { errorResponseAudit } from "./error-response.js";

export async function* downloadCheckAudit(ctx: { server: string }, hash: string) {
  const endpoint = new URL("/" + hash, ctx.server);

  const check = await fetch(endpoint, {
    method: "HEAD",
  });

  // audit CORS headers
  yield* group("CORS Headers", corsResponseHeadersAudit(ctx, check.headers));

  if (!check.ok) yield* group("Error Response", errorResponseAudit(ctx, check));
}
