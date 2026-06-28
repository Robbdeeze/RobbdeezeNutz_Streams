import { serve } from '@hono/node-server';
import { loadConfig } from './config.js';
import { fetchM3U } from './parser.js';
import app, { initServer } from './server.js';
import type { Channel, M3UEntry } from './types.js';

async function main() {
  const config = loadConfig();
  console.log('Successfully initialized configuration profile.');

  let allEntries: M3UEntry[] = [];
  for (const source of config.m3us) {
    try {
      console.log(`Fetching remote entries from playlist source: ${source.name}...`);
      const entries = await fetchM3U(source.url);
      allEntries = allEntries.concat(entries);
      console.log(`  Loaded ${entries.length} entries from ${source.name}`);
    } catch (err) {
      console.error(`Error parsing source ${source.name}:`, err);
    }
  }

  const movieGenres = new Map<string, M3UEntry[]>();
  allEntries.forEach(item => {
    const genre = (item.groupTitle || 'General').trim();
    if (!movieGenres.has(genre)) movieGenres.set(genre, []);
    movieGenres.get(genre)!.push(item);
  });

  const channels: Channel[] = [
    { id: 'main', name: 'Main Unified Channel', entries: allEntries, currentIndex: 0 },
    ...Array.from(movieGenres.entries()).slice(0, 5).map(([genre, entries]) => ({
      id: `genre-${genre.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${genre} Block`,
      entries,
      currentIndex: 0
    }))
  ];

  initServer(channels, config.fillers, config.fillerInterval);
  const port = config.port;

  serve({
    fetch: (req) => {
      channels.forEach(ch => { ch.currentIndex++; });
      return app.fetch(req);
    },
    port
  });

  console.log(`RobbdeezeNutz_Streams running seamlessly at http://localhost:${port}`);
}

main().catch(console.error);
