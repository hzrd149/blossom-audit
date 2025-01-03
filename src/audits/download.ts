import { fail, group, pass } from "../audit.js";
import { getBlobSha256 } from "../helpers/blob.js";
import { responseCorsHeadersAudit } from "./response-cors-headers.js";
import { downloadCheckAudit } from "./download-check.js";
import { endpointCorsHeadersAudit } from "./endpoint-cors-headers.js";

export async function* downloadAudit(ctx: { server: string }, hash: string) {
  yield* group("Check CORS", endpointCorsHeadersAudit(ctx, "/" + hash));

  yield* group("Check Download", downloadCheckAudit(ctx, hash));

  const res = await fetch(new URL("/" + hash, ctx.server));

  yield* group("CORS Headers", responseCorsHeadersAudit(ctx, res.headers));

  const blob = await res.blob();

  const sha256 = await getBlobSha256(blob);
  if (sha256 === hash) yield pass({ summary: `Downloaded blob matches hash`, description: sha256 });
  else
    yield fail({
      summary: "Downloaded blobs sha256 hash did not make requested hash",
      description: `The server is transforming the blob is some way or returning a completely different blob\nRequested ${hash} and got ${sha256}`,
    });

  return blob;
}
