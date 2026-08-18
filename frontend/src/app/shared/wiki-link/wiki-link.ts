export function wikiUrl(title: string): string {
  return `https://it.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}