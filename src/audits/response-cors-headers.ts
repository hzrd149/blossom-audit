import { fail, info, pass, warn } from "../audit.js";
import {
  BLOSSOM_CORS_DOCS,
  CORS_ALLOW_HEADERS,
  CORS_ALLOW_HEADERS_DOCS,
  CORS_ALLOW_METHODS,
  CORS_ALLOW_METHODS_DOCS,
  CORS_ALLOW_ORIGIN,
  CORS_EXPOSE_HEADERS,
  CORS_EXPOSE_HEADERS_DOCS,
} from "../const.js";

export async function* responseCorsHeadersAudit(_ctx: any, headers: Headers) {
  // check CORS allow origin
  if (!headers.has(CORS_ALLOW_ORIGIN)) yield fail({ summary: `Missing ${CORS_ALLOW_ORIGIN}`, see: BLOSSOM_CORS_DOCS });
  else {
    const allow = headers
      .get(CORS_ALLOW_ORIGIN)!
      .split(",")
      .map((v) => v.toLowerCase().trim());

    if (allow.includes("*")) yield pass(`${CORS_ALLOW_ORIGIN} includes wildcard "*"`);
    else
      yield fail({
        summary: `${CORS_ALLOW_ORIGIN} must include wildcard "*"`,
        description: `${CORS_ALLOW_ORIGIN}: ${headers.get(CORS_ALLOW_ORIGIN)}`,
        see: BLOSSOM_CORS_DOCS,
      });
  }

  // check CORS allow headers
  if (headers.has(CORS_ALLOW_HEADERS)) {
    const allow = headers
      .get(CORS_ALLOW_HEADERS)!
      .split(",")
      .map((v) => v.toLowerCase().trim());

    const description = `${CORS_ALLOW_HEADERS}: ${headers.get(CORS_ALLOW_HEADERS)}`;

    if (allow.includes("*")) yield pass(`${CORS_ALLOW_HEADERS} includes wildcard`);
    else
      yield fail({
        summary: `${CORS_ALLOW_HEADERS} missing wildcard "*"`,
        description,
        see: BLOSSOM_CORS_DOCS,
      });

    if (allow.includes("authorization")) yield pass(`${CORS_ALLOW_HEADERS} includes "Authorization"`);
    else
      yield fail({
        summary: `${CORS_ALLOW_HEADERS} missing "Authorization"`,
        description,
        see: BLOSSOM_CORS_DOCS,
      });
  } else
    yield info({
      summary: `Missing ${CORS_ALLOW_HEADERS}`,
      description: `${CORS_ALLOW_HEADERS} is only required on OPTION requests, but since its missing it might be a sign its not being returned on OPTIONS`,
      see: CORS_ALLOW_HEADERS_DOCS,
    });

  // check CORS allow methods
  if (headers.has(CORS_ALLOW_METHODS)) {
    const allow = headers
      .get(CORS_ALLOW_METHODS)!
      .split(",")
      .map((v) => v.toLowerCase().trim());

    const description = `${CORS_ALLOW_METHODS}: ${headers.get(CORS_ALLOW_METHODS)}`;

    if (allow.includes("get")) yield pass(`${CORS_ALLOW_METHODS} includes "GET"`);
    else yield fail({ summary: `${CORS_ALLOW_METHODS} missing "GET"`, description, see: BLOSSOM_CORS_DOCS });

    if (allow.includes("put")) yield pass(`${CORS_ALLOW_METHODS} includes "PUT"`);
    else yield fail({ summary: `${CORS_ALLOW_METHODS} missing "PUT"`, description, see: BLOSSOM_CORS_DOCS });

    if (allow.includes("delete")) yield pass(`${CORS_ALLOW_METHODS} includes "DELETE"`);
    else yield fail({ summary: `${CORS_ALLOW_METHODS} missing "DELETE"`, description, see: BLOSSOM_CORS_DOCS });
  } else
    yield info({
      summary: `Missing ${CORS_ALLOW_METHODS}`,
      description: `${CORS_ALLOW_METHODS} is only required on OPTION requests, but since its missing it might be a sign its not being returned on OPTIONS`,
      see: CORS_ALLOW_METHODS_DOCS,
    });

  // check CORS expose headers
  if (headers.has(CORS_EXPOSE_HEADERS)) {
    const allow = headers
      .get(CORS_EXPOSE_HEADERS)!
      .split(",")
      .map((v) => v.toLowerCase().trim());

    if (allow.includes("*")) yield pass(`${CORS_EXPOSE_HEADERS} includes wildcard`);
    else
      yield fail({
        summary: `${CORS_EXPOSE_HEADERS} missing wildcard "*"`,
        description: `${CORS_EXPOSE_HEADERS}: ${headers.get(CORS_EXPOSE_HEADERS)}`,
        see: CORS_EXPOSE_HEADERS_DOCS,
      });
  } else
    yield warn({
      summary: `Missing ${CORS_EXPOSE_HEADERS}`,
      description: `${CORS_EXPOSE_HEADERS} is useful to allow browser clients to access all response headers`,
      see: CORS_EXPOSE_HEADERS_DOCS,
    });
}
