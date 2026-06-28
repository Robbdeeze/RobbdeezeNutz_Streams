import type { M3UEntry } from './types.js';

export async function fetchM3U(url: string): Promise<M3UEntry[]> {
  const res = await fetch(url);
  const text = await res.text();
  return parseM3U(text);
}

function parseM3U(data: string): M3UEntry[] {
  const lines = data.split('\n');
  const entries: M3UEntry[] = [];
  let current: Partial<M3UEntry> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#EXTINF:')) {
      const titleMatch = trimmed.match(/,([^,]+)$/);
      current.title = titleMatch ? titleMatch[1].trim() : 'Unknown Title';

      const groupMatch = trimmed.match(/group-title="([^"]+)"/);
      current.groupTitle = groupMatch ? groupMatch[1] : undefined;

      const tvgIdMatch = trimmed.match(/tvg-id="([^"]+)"/);
      current.tvgId = tvgIdMatch ? tvgIdMatch[1] : undefined;

      const tvgLogoMatch = trimmed.match(/tvg-logo="([^"]+)"/);
      current.tvgLogo = tvgLogoMatch ? tvgLogoMatch[1] : undefined;
    } else if (trimmed && !trimmed.startsWith('#') && current.title) {
      current.url = trimmed;
      entries.push(current as M3UEntry);
      current = {};
    }
  }
  return entries;
}
