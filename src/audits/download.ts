import { fail, group, pass } from "../audit";
import { getBlobSha256 } from "../helpers/blob";
import { corsResponseHeadersAudit } from "./cors-response-headers";
import { downloadCheckAudit } from "./download-check";
import { endpointCorsHeadersAudit } from "./endpoint-cors-headers";

export async function* downloadAudit(ctx: { server: string }, hash: string) {
  yield await group("Check CORS", endpointCorsHeadersAudit(ctx, "/" + hash));

  yield await group("Check Download", downloadCheckAudit(ctx, hash));

  const res = await fetch(new URL("/" + hash, ctx.server));

  yield await group("CORS Headers", corsResponseHeadersAudit(ctx, res.headers));

  const blob = await res.blob();

  const sha256 = await getBlobSha256(blob);
  if (sha256 === hash) yield pass({ summary: `Downloaded blob matches hash`, description: sha256 });
  else
    yield fail({
      summary: "Downloaded blobs sha256 hash did not make requested hash",
      description: `The server is transforming the blob is some way or returning a completely different blob\nRequested ${hash} and got ${sha256}`,
    });

  // return blob;
}
