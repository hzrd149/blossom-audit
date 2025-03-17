import { fail, pass } from "../audit.js";
import { verbose } from "../helpers/debug.js";

export async function* errorResponseAudit(_ctx: any, res: Response) {
  if (res.headers.has("x-reason"))
    yield pass({
      summary: "X-Reason header",
      description: `Status: ${res.status}\nValue: ${res.headers.get("x-reason")}`,
    });
  else
    yield fail({
      summary: "Missing X-Reason header",
      description: `The X-Reason header is used to provide a human readable error message for the user\nX-Reason: ${res.headers.get("x-reason")}`,
      see: "https://github.com/hzrd149/blossom/blob/master/buds/01.md#error-responses",
    });

  if (!res.bodyUsed) {
    verbose("Response body", await res.text());
  }
}
