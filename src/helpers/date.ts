export function unixNow() {
  return Math.round(Date.now() / 1000);
}

export function oneHour() {
  return unixNow() + 60 * 60;
}
