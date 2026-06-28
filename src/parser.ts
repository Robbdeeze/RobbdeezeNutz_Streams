import type { M3UEntry } from './types.js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export async function fetchM3U(url: string): Promise<M3UEntry[]> {
  let text: string;

  if (url.startsWith('/www/')) {
    const filePath = join(process.cwd(), url.slice(1));
    if (!existsSync(filePath)) {
      throw new Error(`M3U file not found: ${filePath}`);
    }
    text = readFileSync(filePath, 'utf-8');
  } else {
    const res = await fetch(url);
    text = await res.text();
  }

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
