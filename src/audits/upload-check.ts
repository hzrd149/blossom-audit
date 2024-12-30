import { Audit } from "../audit";
import { getBlobSha256 } from "../helpers/blob";
import { CorsHeadersAudit } from "./cors-headers";
import { ErrorResponseAudit } from "./error-response";

export class UploadCheckAudit extends Audit<Blob, { server: string }> {
  protected async audit() {
    const blob = this.input;
    const endpoint = new URL("/upload", this.config.server);

    // BUD-06 check
    const check = await fetch(endpoint, {
      method: "HEAD",
      headers: {
        "x-content-length": String(blob.size),
        "x-content-type": blob.type,
        "x-sha256": await getBlobSha256(blob),
      },
    });

    // check if supported
    if (check.status === 404) {
      this.info({
        summary: "BUD-06 upload check is not supported",
        see: "https://github.com/hzrd149/blossom/blob/master/buds/06.md",
      });

      this.log("HEAD endpoint not supported, skipping checks");

      // exit
      return;
    }

    // audit CORS headers
    await this.runChildAudit(CorsHeadersAudit, "cors headers", check.headers);

    if (check.ok) this.log("Upload check passed");
    else {
      this.log(`Check failed ${check.status}: ${check.headers.get("x-reason")}`);

      await this.runChildAudit(ErrorResponseAudit, "error response", check);
    }
  }
}
