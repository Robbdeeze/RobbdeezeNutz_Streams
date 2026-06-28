import { Hono } from 'hono';
import { request } from 'undici';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Channel, Filler, Stats } from './types.js';
import { loadConfig } from './config.js';

const app = new Hono();
let channels: Channel[] = [];
let fillers: Filler[] = [];
let fillerInterval = 5;
let authPassword = '';

const MEDIA_EXT = new Set(['.mp4', '.mkv', '.avi', '.mov', '.webm']);
const RESOLVE_CACHE = new Map<string, { url: string; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const PROXY_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml',
};

// Basic auth middleware
app.use('*', async (c, next) => {
  if (!authPassword) return next();

  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Basic ')) {
    return c.text('Unauthorized', 401, {
      'WWW-Authenticate': 'Basic realm="RobbdeezeNutz Streams"',
    });
  }

  const decoded = atob(auth.slice(6));
  const password = decoded.split(':')[1];
  if (password !== authPassword) {
    return c.text('Unauthorized', 401, {
      'WWW-Authenticate': 'Basic realm="RobbdeezeNutz Streams"',
    });
  }

  return next();
});

export const stats: Stats = {
  totalPlays: 0,
  fillerPlays: 0
};

export function initServer(ch: Channel[], f: Filler[], interval: number, configPassword?: string) {
  channels = ch;
  fillers = f;
  fillerInterval = interval;
  authPassword = configPassword || '';
}

app.get('/', (c) => {
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>RobbdeezeNutz_Streams Dashboard</title>
    <style>body { font-family: sans-serif; padding: 20px; background: #121212; color: #fff; }</style>
  </head>
  <body>
    <h1>RobbdeezeNutz_Streams Control Center</h1>
    <p><a href="/channels.m3u" style="color: #1e90ff;">📺 Download Channel Playlist M3U</a></p>

    <h2>Performance Statistics</h2>
    <ul>
      <li>Total Stream Invocations: ${stats.totalPlays}</li>
      <li>Commercial/Filler Dispatches: ${stats.fillerPlays}</li>
    </ul>

    <h2>Active Channels (${channels.length})</h2>
    <ul>`;

  channels.forEach(ch => {
    const isFillerTurn = ch.currentIndex % (fillerInterval + 1) === 0;
    let currentTitle = "Loading...";

    if (isFillerTurn && fillers.length > 0) {
      currentTitle = "[COMMERCIAL/AI ART FILLER]";
    } else if (ch.entries.length > 0) {
      const idx = ch.currentIndex % ch.entries.length;
      currentTitle = ch.entries[idx].title;
    }

    html += `<li><strong>${ch.name}</strong> — Now Playing: <span style="color: #ffd700;">${currentTitle}</span> (Index: ${ch.currentIndex})</li>`;
  });

  html += `</ul></body></html>`;
  return c.html(html);
});

app.get('/channels.m3u', (c) => {
  let m3u = '#EXTM3U\n';
  channels.forEach(ch => {
    m3u += `#EXTINF:-1,${ch.name}\nhttp://${c.req.header('host')}/channel/${ch.id}\n`;
  });
  return c.text(m3u, 200, { 'Content-Type': 'text/plain' });
});

app.get('/www/:file', (c) => {
  const file = c.req.param('file');
  const wwwDir = join(process.cwd(), 'www');
  const filePath = join(wwwDir, file);

  // Prevent path traversal
  if (!filePath.startsWith(wwwDir) || !filePath.endsWith('.m3u')) {
    return c.text('Forbidden', 403);
  }

  if (!existsSync(filePath)) {
    return c.text('Not found', 404);
  }

  const content = readFileSync(filePath, 'utf-8');
  return c.text(content, 200, { 'Content-Type': 'text/plain' });
});

app.get('/resolve', async (c) => {
  const path = c.req.query('path');
  if (!path) return c.text('Missing path', 400);

  const cached = RESOLVE_CACHE.get(path);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return c.redirect(cached.url);
  }

  const mediaUrl = await resolveMediaUrl(path);
  if (!mediaUrl) return c.text('No playable media found at ' + path, 404);

  RESOLVE_CACHE.set(path, { url: mediaUrl, ts: Date.now() });
  return c.redirect(mediaUrl);
});

async function resolveMediaUrl(subdirPath: string): Promise<string | null> {
  // Retry up to 3 times with delay to handle Cloudflare challenges
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await request(`https://a.111477.xyz${subdirPath}`, { headers: PROXY_HEADERS });
      const body = await res.body.text();

      // Detect Cloudflare challenge page
      if (body.includes('cdn-cgi/challenge-platform') || body.includes('Just a moment')) {
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        return null;
      }

      const regex = /href="([^"]+)"/g;
      let match;
      while ((match = regex.exec(body)) !== null) {
        const h = match[1];
        const ext = h.substring(h.lastIndexOf('.')).toLowerCase();
        if (MEDIA_EXT.has(ext)) {
          return `https://a.111477.xyz${h}`;
        }
      }
      return null;
    } catch {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      return null;
    }
  }
  return null;
}

app.get('/channel/:id', (c) => {
  const id = c.req.param('id');
  const channel = channels.find(ch => ch.id === id);
  if (!channel || channel.entries.length === 0) return c.notFound();

  const config = loadConfig();
  const isFillerTurn = channel.currentIndex % (config.fillerInterval + 1) === 0;

  stats.totalPlays++;

  if (isFillerTurn && fillers.length > 0) {
    stats.fillerPlays++;
    const randomFiller = fillers[Math.floor(Math.random() * fillers.length)];
    return c.redirect(randomFiller.url);
  }

  const mainItem = channel.entries[channel.currentIndex % channel.entries.length];
  return c.redirect(mainItem.url);
});

export default app;
