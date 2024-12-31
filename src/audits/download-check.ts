import { group } from "../audit";
import { corsResponseHeadersAudit } from "./cors-response-headers";
import { errorResponseAudit } from "./error-response";

export async function* downloadCheckAudit(ctx: { server: string }, hash: string) {
  const endpoint = new URL("/" + hash, ctx.server);

  const check = await fetch(endpoint, {
    method: "HEAD",
  });

  // audit CORS headers
  yield await group("CORS Headers", corsResponseHeadersAudit(ctx, check.headers));

  if (!check.ok) yield await group("Error Response", errorResponseAudit(ctx, check));
}
