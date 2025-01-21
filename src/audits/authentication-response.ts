import { fail, pass, warn } from "../audit.js";

/** Checks a 401 response */
export async function* authenticationResponseAudit(_ctx: any, response: Response) {
  if (response.headers.has("WWW-Authenticate")) {
    if (response.headers.get("WWW-Authenticate") === "Bearer") yield pass(`WWW-Authenticate is set to "Bearer"`);
    else yield fail(`WWW-Authenticate must be set to "Bearer"`);
  } else
    yield warn({
      summary: "Missing WWW-Authenticate header",
      description: "WWW-Authenticate can be used to let the client know what authentication scheme it should use",
      see: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate",
    });
}
