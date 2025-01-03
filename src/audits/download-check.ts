import { group } from "../audit.js";
import { responseCorsHeadersAudit } from "./response-cors-headers.js";
import { errorResponseAudit } from "./error-response.js";

export async function* downloadCheckAudit(ctx: { server: string }, hash: string) {
  const endpoint = new URL("/" + hash, ctx.server);

  const check = await fetch(endpoint, {
    method: "HEAD",
  });

  // audit CORS headers
  yield* group("CORS Headers", responseCorsHeadersAudit(ctx, check.headers));

  if (!check.ok) yield* group("Error Response", errorResponseAudit(ctx, check));
}
