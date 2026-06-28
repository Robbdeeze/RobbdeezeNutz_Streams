import { serve } from '@hono/node-server';
import { loadConfig } from './config.js';
import { fetchM3U } from './parser.js';
import app, { initServer } from './server.js';
import type { Channel, M3UEntry } from './types.js';

async function main() {
  const config = loadConfig();
  console.log('Successfully initialized configuration profile.');

  const channels: Channel[] = [];

  for (const source of config.m3us) {
    let entries: M3UEntry[] = [];
    try {
      console.log(`Fetching remote entries from playlist source: ${source.name}...`);
      entries = await fetchM3U(source.url);
      console.log(`  Loaded ${entries.length} entries from ${source.name}`);
    } catch (err) {
      console.error(`Error parsing source ${source.name}:`, err);
      continue;
    }

    if (entries.length === 0) continue;

    const sourceId = source.name.toLowerCase().replace(/\s+/g, '-');

    channels.push({
      id: sourceId,
      name: source.name,
      entries,
      currentIndex: 0
    });

    const genreMap = new Map<string, M3UEntry[]>();
    entries.forEach(item => {
      const genre = (item.groupTitle || 'General').trim();
      if (!genreMap.has(genre)) genreMap.set(genre, []);
      genreMap.get(genre)!.push(item);
    });

    const genreChannels = Array.from(genreMap.entries())
      .filter(([, genreEntries]) => genreEntries.length >= 3)
      .slice(0, 5)
      .map(([genre, genreEntries]) => ({
        id: `${sourceId}-${genre.toLowerCase().replace(/\s+/g, '-')}`,
        name: `${source.name} - ${genre}`,
        entries: genreEntries,
        currentIndex: 0
      }));

    channels.push(...genreChannels);
    console.log(`  Created ${1 + genreChannels.length} channels for ${source.name}`);
  }

  if (channels.length === 0) {
    console.error('No channels could be created — check your M3U URLs.');
    process.exit(1);
  }

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
  console.log(`Active channels: ${channels.map(ch => ch.name).join(', ')}`);
}

main().catch(console.error);
