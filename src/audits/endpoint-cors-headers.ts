import { fail, pass, warn } from "../audit.js";
import {
  BLOSSOM_CORS_DOCS,
  CORS_ALLOW_HEADERS,
  CORS_ALLOW_METHODS,
  CORS_ALLOW_METHODS_DOCS,
  CORS_ALLOW_ORIGIN,
  CORS_MAX_AGE,
  CORS_MAX_AGE_DOCS,
} from "../const.js";

/** Check an endpoints CORS headers */
export async function* endpointCorsHeadersAudit(ctx: { server: string }, endpoint: string) {
  const res = await fetch(new URL(endpoint, ctx.server), { method: "OPTIONS" });
  const headers = res.headers;

  // check CORS allow origin
  if (headers.has(CORS_ALLOW_ORIGIN)) {
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
  } else {
    yield fail({
      summary: `Missing ${CORS_ALLOW_ORIGIN}`,
      description: `${CORS_ALLOW_ORIGIN} is required to allow web apps to access the server`,
      see: BLOSSOM_CORS_DOCS,
    });
  }

  // check CORS allow headers
  if (headers.has(CORS_ALLOW_HEADERS)) {
    const allow = headers
      .get(CORS_ALLOW_HEADERS)!
      .split(",")
      .map((v) => v.toLowerCase().trim());

    if (allow.includes("*")) yield pass(`${CORS_ALLOW_HEADERS} includes wildcard`);
    else yield fail({ summary: `${CORS_ALLOW_HEADERS} missing wildcard "*"`, see: BLOSSOM_CORS_DOCS });

    if (allow.includes("authorization")) yield pass(`${CORS_ALLOW_HEADERS} includes "Authorization"`);
    else
      yield fail({
        summary: `${CORS_ALLOW_HEADERS} missing "Authorization"`,
        description: `${CORS_ALLOW_HEADERS}: ${headers.get(CORS_ALLOW_HEADERS)}`,
        see: BLOSSOM_CORS_DOCS,
      });
  } else
    yield fail({
      summary: `Missing ${CORS_ALLOW_HEADERS}`,
      description: `${CORS_ALLOW_HEADERS} is required to allow clients to send the "Authorization" header for HEAD requests`,
      see: CORS_ALLOW_METHODS_DOCS,
    });

  // check CORS allow methods
  if (headers.has(CORS_ALLOW_METHODS)) {
    const allow = headers
      .get(CORS_ALLOW_METHODS)!
      .split(",")
      .map((v) => v.toLowerCase().trim());

    const headerDebug = `${CORS_ALLOW_METHODS}: ${headers.get(CORS_ALLOW_METHODS)}`;

    if (allow.includes("get")) yield pass(`${CORS_ALLOW_METHODS} includes "GET"`);
    else
      yield fail({ summary: `${CORS_ALLOW_METHODS} missing "GET"`, description: headerDebug, see: BLOSSOM_CORS_DOCS });

    if (allow.includes("put")) yield pass(`${CORS_ALLOW_METHODS} includes "PUT"`);
    else
      yield fail({ summary: `${CORS_ALLOW_METHODS} missing "PUT"`, description: headerDebug, see: BLOSSOM_CORS_DOCS });

    if (allow.includes("delete")) yield pass(`${CORS_ALLOW_METHODS} includes "DELETE"`);
    else
      yield fail({
        summary: `${CORS_ALLOW_METHODS} missing "DELETE"`,
        description: headerDebug,
        see: BLOSSOM_CORS_DOCS,
      });
  } else
    yield fail({
      summary: `Missing ${CORS_ALLOW_METHODS}`,
      description: `${CORS_ALLOW_METHODS} must allow at least GET, PUT, DELETE`,
      see: CORS_ALLOW_METHODS_DOCS,
    });

  // check CORS caching header
  if (headers.has(CORS_MAX_AGE)) {
    const age = parseInt(headers.get(CORS_MAX_AGE)!);
    const description = `${CORS_MAX_AGE}: ${headers.get(CORS_MAX_AGE)}`;

    if (!Number.isFinite(age))
      yield fail({ summary: `${CORS_MAX_AGE} is not a number`, description, see: CORS_MAX_AGE_DOCS });
    else if (age <= 0)
      yield fail({ summary: `${CORS_MAX_AGE} must be a positive number`, description, see: CORS_MAX_AGE_DOCS });
    else yield pass(`${CORS_MAX_AGE} is ${age}`);
  } else
    yield warn({
      summary: `Missing ${CORS_MAX_AGE}`,
      description: `${CORS_MAX_AGE} allows the client to cache the CORS requests for a specified period of time`,
      see: CORS_MAX_AGE_DOCS,
    });
}
