import { Audit } from "../audit";

const CORS_ALLOW_ORIGIN = "Access-Control-Allow-Origin";
const CORS_ALLOW_HEADERS = "Access-Control-Allow-Headers";
const CORS_ALLOW_METHODS = "Access-Control-Allow-Methods";
const CORS_EXPOSE_HEADERS = "Access-Control-Expose-Headers";
const CORS_EXPOSE_HEADERS_DOCS =
  "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers";
const CORS_MAX_AGE = "Access-Control-Allow-Headers";

const BLOSSOM_CORS = "https://github.com/hzrd149/blossom/blob/master/buds/01.md#cross-origin-headers";

export class CorsHeadersAudit extends Audit<Headers> {
  protected async audit() {
    const headers = this.input;

    // check CORS allow origin
    if (!headers.has(CORS_ALLOW_ORIGIN)) this.fail({ summary: `Missing ${CORS_ALLOW_ORIGIN}`, see: BLOSSOM_CORS });
    else {
      this.log(`${CORS_ALLOW_ORIGIN}: ${headers.get(CORS_ALLOW_ORIGIN)}`);

      const allow = headers
        .get(CORS_ALLOW_ORIGIN)!
        .split(",")
        .map((v) => v.toLowerCase().trim());

      if (allow.includes("*")) this.pass(`${CORS_ALLOW_ORIGIN} includes wildcard "*"`);
      else this.fail({ summary: `${CORS_ALLOW_ORIGIN} must include wildcard "*"`, see: BLOSSOM_CORS });
    }

    // check CORS allow headers
    if (!headers.has(CORS_ALLOW_HEADERS))
      this.fail({
        summary: `Missing ${CORS_ALLOW_HEADERS}`,
        description: `${CORS_ALLOW_HEADERS} is required to allow clients to send the "Authorization" header for HEAD requests`,
        see: BLOSSOM_CORS,
      });
    else {
      this.log(`${CORS_ALLOW_HEADERS}: ${headers.get(CORS_ALLOW_HEADERS)}`);
      const allow = headers
        .get(CORS_ALLOW_HEADERS)!
        .split(",")
        .map((v) => v.toLowerCase().trim());

      if (allow.includes("*")) this.pass(`${CORS_ALLOW_HEADERS} includes wildcard`);
      else this.fail({ summary: `${CORS_ALLOW_HEADERS} missing wildcard "*"`, see: BLOSSOM_CORS });

      if (allow.includes("authorization")) this.pass(`${CORS_ALLOW_HEADERS} includes "Authorization"`);
      else this.fail({ summary: `${CORS_ALLOW_HEADERS} missing "Authorization"`, see: BLOSSOM_CORS });
    }

    // check CORS allow methods
    if (!headers.has(CORS_ALLOW_METHODS))
      this.fail({
        summary: `Missing ${CORS_ALLOW_METHODS}`,
        see: BLOSSOM_CORS,
      });
    else {
      this.log(`${CORS_ALLOW_METHODS}: ${headers.get(CORS_ALLOW_METHODS)}`);
      const allow = headers
        .get(CORS_ALLOW_METHODS)!
        .split(",")
        .map((v) => v.toLowerCase().trim());

      if (allow.includes("get")) this.pass(`${CORS_ALLOW_METHODS} includes "GET"`);
      else this.fail({ summary: `${CORS_ALLOW_METHODS} missing "GET"`, see: BLOSSOM_CORS });

      if (allow.includes("put")) this.pass(`${CORS_ALLOW_METHODS} includes "PUT"`);
      else this.fail({ summary: `${CORS_ALLOW_METHODS} missing "PUT"`, see: BLOSSOM_CORS });

      if (allow.includes("delete")) this.pass(`${CORS_ALLOW_METHODS} includes "DELETE"`);
      else this.fail({ summary: `${CORS_ALLOW_METHODS} missing "DELETE"`, see: BLOSSOM_CORS });
    }

    // check CORS expose headers
    if (headers.has(CORS_EXPOSE_HEADERS)) {
      this.log(`${CORS_EXPOSE_HEADERS}: ${headers.get(CORS_EXPOSE_HEADERS)}`);
      const allow = headers
        .get(CORS_EXPOSE_HEADERS)!
        .split(",")
        .map((v) => v.toLowerCase().trim());

      if (allow.includes("*")) this.pass(`${CORS_EXPOSE_HEADERS} includes wildcard`);
      else this.fail({ summary: `${CORS_EXPOSE_HEADERS} missing wildcard "*"`, see: CORS_EXPOSE_HEADERS_DOCS });
    } else
      this.warn({
        summary: `Missing ${CORS_EXPOSE_HEADERS}`,
        description: `${CORS_EXPOSE_HEADERS} is useful to allow browser clients to access all response headers`,
        see: CORS_EXPOSE_HEADERS_DOCS,
      });

    // check CORS caching header
    if (headers.has(CORS_MAX_AGE)) {
      this.log(`${CORS_MAX_AGE}: ${headers.get(CORS_MAX_AGE)}`);
      const age = parseInt(headers.get(CORS_MAX_AGE)!);

      if (!Number.isFinite(age)) this.fail(`${CORS_MAX_AGE} is not a number`);
      else if (age <= 0) this.fail(`${CORS_MAX_AGE} must be a positive number`);
      else this.pass(`${CORS_MAX_AGE} is ${age}`);
    } else
      this.warn({
        summary: `Missing ${CORS_MAX_AGE}`,
        description: `${CORS_MAX_AGE} allows the client to cache the CORS requests for a specified period of time`,
        see: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age",
      });
  }
}
