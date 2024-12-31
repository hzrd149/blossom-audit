import { group } from "../audit";
import { getBlobSha256 } from "../helpers/blob";
import { downloadAudit } from "./download";
import { uploadAudit } from "./upload";

export async function* fullAudit(ctx: { server: string }, blob: Blob) {
  const hash = await getBlobSha256(blob);

  yield await group("Upload", uploadAudit(ctx, blob));

  yield await group("Download", downloadAudit(ctx, hash));
}
