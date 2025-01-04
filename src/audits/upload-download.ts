import { fail, group, pass } from "../audit.js";
import { getBlobSha256 } from "../helpers/blob.js";
import { downloadBlobAudit } from "./download-blob.js";
import { uploadBlobAudit } from "./upload-blob.js";

export async function* uploadDownloadAudit(ctx: { server: string }, blob: Blob) {
  const hash = await getBlobSha256(blob);

  // TODO: need to ensure upload is successful for test to continue
  const upload = yield* group("Upload", uploadBlobAudit(ctx, blob));

  if (upload) {
    yield pass({
      summary: "Uploaded blob",
      description: JSON.stringify(upload, null, 2),
    });
  } else throw new Error("Upload failed");

  const downloaded = yield* group("Download", downloadBlobAudit(ctx, new URL(hash, ctx.server)));

  if (downloaded) {
    const downloadedHash = await getBlobSha256(downloaded);
    const uploadedHash = await getBlobSha256(blob);
    if (downloadedHash === uploadedHash) yield pass({ summary: "Downloaded blob", description: downloadedHash });
    else
      yield fail({ summary: "Hash mismatch", description: `Original: ${uploadedHash}\nDownloaded: ${downloadedHash}` });
  } else throw new Error("Failed to download blob");
}
