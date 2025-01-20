export function encodeAuthorizationHeader(event: any) {
  return "Nostr " + btoa(JSON.stringify(event));
}
