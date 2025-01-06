export const debug = {
  enabled: false,
};

export function logRequest(request: Request) {
  if (!debug.enabled) return;
  console.log(`Making ${request.method} request to ${request.url} with`, request.headers, "and body", request.body);
}

export function logResponse(response: Response) {
  if (!debug.enabled) return;
  console.log(`Got response ${response.status} ${response.statusText} with`, response.headers);
}

export function verbose(...args: any[]) {
  if (!debug.enabled) return;
  console.log(...args);
}

export async function fetchWithLogs(...args: Parameters<typeof fetch>) {
  const request = new Request(...args);
  logRequest(request);
  const response = await fetch(request);
  logResponse(response);
  return response;
}
