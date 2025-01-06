import { group } from "../audit.js";
import { fetchWithLogs } from "../helpers/debug.js";
import { errorResponseAudit } from "./error-response.js";

export async function* downloadCheckAudit(ctx: { server?: string }, url: string | URL) {
  if (typeof url === "string") {
    if (URL.canParse(url)) url = new URL(url);
    else if (ctx.server) url = new URL(url, ctx.server);
    else throw new Error("Missing server");
  }

  const check = await fetchWithLogs(url, {
    method: "HEAD",
  });

  if (!check.ok) yield* group("Error Response", errorResponseAudit(ctx, check));

  return check;
}
