import { Audit } from "../audit";
import { getBlobSha256 } from "../helpers/blob";
import { BlobDescriptorAudit } from "./blob-descriptor";
import { CorsHeadersAudit } from "./cors-headers";
import { ErrorResponseAudit } from "./error-response";
import { UploadCheckAudit } from "./upload-check";

export class PublicUploadAudit extends Audit<Blob, { server: string }> {
  protected async audit() {
    const blob = this.input;
    const endpoint = new URL("/upload", this.config.server);

    // BUD-06 check
    await this.runChildAudit(UploadCheckAudit, "check upload", blob);

    const sha256 = await getBlobSha256(blob);
    this.log(`calculated hash ${sha256}`);

    const upload = await fetch(endpoint, { method: "PUT", headers: { "x-sha256": sha256 } });

    // audit CORS headers
    await this.runChildAudit(CorsHeadersAudit, "cors headers", upload.headers);

    if (upload.ok) {
      this.log("Upload success");

      // check headers
      if (!upload.headers.has("content-type")) this.fail("Response missing Content-Type header");
      else if (upload.headers.get("content-type")!.startsWith("application/json"))
        this.pass("Content-Type is application/json");
      else this.fail("Content-Type is not application/json");

      // parse response body
      let result: any;
      try {
        result = await upload.json();
      } catch (error) {
        this.fail({
          summary: "Response body is not valid JSON",
          description: String(error),
          see: "https://github.com/hzrd149/blossom/blob/master/buds/02.md#put-upload---upload-blob",
        });

        return; // abort
      }

      // check blob descriptor
      await this.runChildAudit(BlobDescriptorAudit, "blob descriptor", result);
    } else {
      this.log(`Upload failed ${upload.status}: ${upload.headers.get("x-reason")}`);

      await this.runChildAudit(ErrorResponseAudit, "error response", upload);
    }
  }
}
