export function genId(prefix: string) {
  const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `${prefix}${hex}`;
}
