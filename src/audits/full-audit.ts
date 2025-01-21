import { fail, group, pass } from "../audit.js";
import { getBlobSha256 } from "../helpers/blob.js";
import { verbose } from "../helpers/debug.js";
import { SingerContext } from "./context.js";
import { downloadBlobAudit } from "./download-blob.js";
import { listAudit } from "./list-audit.js";
import { uploadBlobAudit } from "./upload-blob.js";

export async function* fullAudit(ctx: { server: string } & SingerContext, blob: Blob) {
  // TODO: need to ensure upload is successful for test to continue
  const upload = yield* group("Upload", uploadBlobAudit(ctx, blob));

  if (upload) {
    yield pass({
      summary: "Uploaded blob",
      description: upload.sha256,
    });
  } else throw new Error("Upload failed");

  if (ctx.signer) {
    verbose("Signer is available, checking list endpoint");
    const pubkey = await ctx.signer.getPublicKey();
    const list = yield* group("List blobs", listAudit(ctx, pubkey));

    if (list) {
      if (list.some((b) => b.sha256 === upload.sha256)) {
        yield pass("List endpoint has uploaded blob");
      } else yield fail("Unable to find uploaded blob");
    } else yield fail("Failed to get list of uploaded blobs");
  }

  const downloaded = yield* group("Download blob", downloadBlobAudit(ctx, new URL(upload.sha256, ctx.server)));

  if (downloaded) {
    const downloadedHash = await getBlobSha256(downloaded);
    yield pass({ summary: "Downloaded blob", description: downloadedHash });
  } else throw new Error("Failed to download blob");
}
