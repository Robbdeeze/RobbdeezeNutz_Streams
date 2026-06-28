import { request } from 'undici';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 'https://a.111477.xyz';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml',
};

async function fetchDir(url: string): Promise<string[]> {
  const res = await request(url, { headers: HEADERS });
  const body = await res.body.text();
  const links: string[] = [];
  const regex = /href="([^"]+)"/g;
  let match;
  while ((match = regex.exec(body)) !== null) {
    const h = match[1];
    if (h && !h.startsWith('?') && !h.startsWith('/cdn-cgi') && h !== '/' && h !== '../' && !h.startsWith('http')) {
      links.push(h);
    }
  }
  return links;
}

async function generate() {
  const outDir = resolve('www');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const sources: { name: string; path: string; out: string }[] = [
    { name: 'Movies', path: '/movies/', out: 'movies.m3u' },
    { name: 'TV Shows', path: '/tvs/', out: 'tv-shows.m3u' },
    { name: 'Anime', path: '/misc/anime/', out: 'anime.m3u' },
  ];

  for (const source of sources) {
    console.log(`Fetching ${source.path}...`);
    const rawEntries = await fetchDir(BASE + source.path);
    const entries = rawEntries.filter(e => e.endsWith('/'));
    console.log(`  Found ${entries.length} ${source.name.toLowerCase()}`);

    const lines: string[] = ['#EXTM3U'];
    for (const entry of entries) {
      // entry is like /movies/Title%20(Year)/
      const title = decodeURIComponent(entry.replace(/\/$/, '')).split('/').pop() || entry;
      const resolveUrl = `/resolve?path=${encodeURIComponent(entry)}`;
      lines.push(`#EXTINF:-1,${title}`, resolveUrl);
    }

    console.log(`  Writing ${lines.length - 1} entries to ${source.out}`);
    writeFileSync(resolve(outDir, source.out), lines.join('\n') + '\n', 'utf-8');
  }
}

generate().catch(console.error);
