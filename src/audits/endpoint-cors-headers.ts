import { fail, pass, warn } from "../audit.js";
import {
  BLOSSOM_CORS_DOCS,
  CORS_ALLOW_HEADERS,
  CORS_ALLOW_METHODS,
  CORS_ALLOW_METHODS_DOCS,
  CORS_ALLOW_ORIGIN,
  CORS_EXPOSE_HEADERS,
  CORS_EXPOSE_HEADERS_DOCS,
  CORS_MAX_AGE,
} from "../const.js";

/** Check an endpoints CORS headers */
export async function* endpointCorsHeadersAudit(ctx: { server: string }, endpoint: string) {
  const res = await fetch(new URL(endpoint, ctx.server), { method: "OPTIONS" });
  const headers = res.headers;

  // check CORS allow origin
  if (headers.has(CORS_ALLOW_ORIGIN)) {
    console.log(`${CORS_ALLOW_ORIGIN}: ${headers.get(CORS_ALLOW_ORIGIN)}`);

    const allow = headers
      .get(CORS_ALLOW_ORIGIN)!
      .split(",")
      .map((v) => v.toLowerCase().trim());

    if (allow.includes("*")) yield pass(`${CORS_ALLOW_ORIGIN} includes wildcard "*"`);
    else yield fail({ summary: `${CORS_ALLOW_ORIGIN} must include wildcard "*"`, see: BLOSSOM_CORS_DOCS });
  } else {
    yield fail({
      summary: `Missing ${CORS_ALLOW_ORIGIN}`,
      description: `${CORS_ALLOW_ORIGIN} is required to allow web apps to access the server`,
      see: BLOSSOM_CORS_DOCS,
    });
  }

  // check CORS allow headers
  if (headers.has(CORS_ALLOW_HEADERS)) {
    console.log(`${CORS_ALLOW_HEADERS}: ${headers.get(CORS_ALLOW_HEADERS)}`);
    const allow = headers
      .get(CORS_ALLOW_HEADERS)!
      .split(",")
      .map((v) => v.toLowerCase().trim());

    if (allow.includes("*")) yield pass(`${CORS_ALLOW_HEADERS} includes wildcard`);
    else yield fail({ summary: `${CORS_ALLOW_HEADERS} missing wildcard "*"`, see: BLOSSOM_CORS_DOCS });

    if (allow.includes("authorization")) yield pass(`${CORS_ALLOW_HEADERS} includes "Authorization"`);
    else yield fail({ summary: `${CORS_ALLOW_HEADERS} missing "Authorization"`, see: BLOSSOM_CORS_DOCS });
  } else
    yield fail({
      summary: `Missing ${CORS_ALLOW_HEADERS}`,
      description: `${CORS_ALLOW_HEADERS} is required to allow clients to send the "Authorization" header for HEAD requests`,
      see: CORS_ALLOW_METHODS_DOCS,
    });

  // check CORS allow methods
  if (headers.has(CORS_ALLOW_METHODS)) {
    console.log(`${CORS_ALLOW_METHODS}: ${headers.get(CORS_ALLOW_METHODS)}`);
    const allow = headers
      .get(CORS_ALLOW_METHODS)!
      .split(",")
      .map((v) => v.toLowerCase().trim());

    if (allow.includes("get")) yield pass(`${CORS_ALLOW_METHODS} includes "GET"`);
    else yield fail({ summary: `${CORS_ALLOW_METHODS} missing "GET"`, see: BLOSSOM_CORS_DOCS });

    if (allow.includes("put")) yield pass(`${CORS_ALLOW_METHODS} includes "PUT"`);
    else yield fail({ summary: `${CORS_ALLOW_METHODS} missing "PUT"`, see: BLOSSOM_CORS_DOCS });

    if (allow.includes("delete")) yield pass(`${CORS_ALLOW_METHODS} includes "DELETE"`);
    else yield fail({ summary: `${CORS_ALLOW_METHODS} missing "DELETE"`, see: BLOSSOM_CORS_DOCS });
  } else
    yield fail({
      summary: `Missing ${CORS_ALLOW_METHODS}`,
      description: `${CORS_ALLOW_METHODS} must allow at least GET, PUT, DELETE`,
      see: CORS_ALLOW_METHODS_DOCS,
    });

  // check CORS expose headers
  if (headers.has(CORS_EXPOSE_HEADERS)) {
    console.log(`${CORS_EXPOSE_HEADERS}: ${headers.get(CORS_EXPOSE_HEADERS)}`);
    const allow = headers
      .get(CORS_EXPOSE_HEADERS)!
      .split(",")
      .map((v) => v.toLowerCase().trim());

    if (allow.includes("*")) yield pass(`${CORS_EXPOSE_HEADERS} includes wildcard`);
    else yield fail({ summary: `${CORS_EXPOSE_HEADERS} missing wildcard "*"`, see: CORS_EXPOSE_HEADERS_DOCS });
  } else
    yield warn({
      summary: `Missing ${CORS_EXPOSE_HEADERS}`,
      description: `${CORS_EXPOSE_HEADERS} is useful to allow browser clients to access all response headers`,
      see: CORS_EXPOSE_HEADERS_DOCS,
    });

  // check CORS caching header
  if (headers.has(CORS_MAX_AGE)) {
    console.log(`${CORS_MAX_AGE}: ${headers.get(CORS_MAX_AGE)}`);
    const age = parseInt(headers.get(CORS_MAX_AGE)!);

    if (!Number.isFinite(age)) yield fail(`${CORS_MAX_AGE} is not a number`);
    else if (age <= 0) yield fail(`${CORS_MAX_AGE} must be a positive number`);
    else yield pass(`${CORS_MAX_AGE} is ${age}`);
  } else
    yield warn({
      summary: `Missing ${CORS_MAX_AGE}`,
      description: `${CORS_MAX_AGE} allows the client to cache the CORS requests for a specified period of time`,
      see: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age",
    });
}
