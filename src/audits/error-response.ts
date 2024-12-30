import { Audit } from "../audit";

export class ErrorResponseAudit extends Audit<Response> {
  protected async audit() {
    const res = this.input;

    if (res.headers.has("x-reason"))
      this.pass({ summary: "X-Reason header", description: `Value: ${res.headers.get("x-reason")}` });
    else
      this.fail({
        summary: "Missing X-Reason header",
        description: `The X-Reason header is used to provide a human readable error message for the user`,
        see: "https://github.com/hzrd149/blossom/blob/master/buds/01.md#error-responses",
      });
  }
}
