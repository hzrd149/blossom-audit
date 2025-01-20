import { group, info } from "../audit.js";
import { getBlobSha256 } from "../helpers/blob.js";
import { SingerContext } from "./context.js";
import { downloadBlobAudit } from "./download-blob.js";
import { uploadBlobAudit } from "./upload-blob.js";

export async function* fullAudit(ctx: { server: string } & SingerContext, blob: Blob) {
  // TODO: need to ensure upload is successful for test to continue
  const upload = yield* group("Upload", uploadBlobAudit(ctx, blob));

  if (upload) {
    yield info({
      summary: "Uploaded blob",
      description: JSON.stringify(upload, null, 2),
    });
  } else throw new Error("Upload failed");

  const downloaded = yield* group("Download", downloadBlobAudit(ctx, new URL(upload.sha256, ctx.server)));

  if (downloaded) {
    const downloadedHash = await getBlobSha256(downloaded);
    yield info({ summary: "Downloaded blob", description: downloadedHash });
  } else throw new Error("Failed to download blob");
}
