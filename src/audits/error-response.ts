import { fail, pass } from "../audit.js";

export async function* errorResponseAudit(_ctx: any, res: Response) {
  if (res.headers.has("x-reason"))
    yield pass({ summary: "X-Reason header", description: `Value: ${res.headers.get("x-reason")}` });
  else
    yield fail({
      summary: "Missing X-Reason header",
      description: `The X-Reason header is used to provide a human readable error message for the user`,
      see: "https://github.com/hzrd149/blossom/blob/master/buds/01.md#error-responses",
    });
}
