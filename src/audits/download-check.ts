import { group, info } from "../audit.js";
import { fetchWithLogs } from "../helpers/debug.js";
import { errorResponseAudit } from "./error-response.js";

export async function* downloadCheckAudit(ctx: { server?: string }, url: string | URL) {
  if (typeof url === "string") {
    if (URL.canParse(url)) url = new URL(url);
    else if (ctx.server) url = new URL(url, ctx.server);
    else throw new Error("Missing server");
  }

  let response = await fetchWithLogs(url, {
    method: "HEAD",
  });

  if (!response.ok) yield* group("Error Response", errorResponseAudit(ctx, response));

  yield info({
    summary: response.ok ? "Server has blob" : "Server does not have blob",
    description: `Got ${response.status} (${response.statusText})`,
  });

  return response;
}
