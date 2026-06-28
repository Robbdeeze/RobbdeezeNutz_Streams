import { Hono } from 'hono';
import type { Channel, Filler, Stats } from './types.js';
import { loadConfig } from './config.js';

const app = new Hono();
let channels: Channel[] = [];
let fillers: Filler[] = [];
let fillerInterval = 5;

export const stats: Stats = {
  totalPlays: 0,
  fillerPlays: 0
};

export function initServer(ch: Channel[], f: Filler[], interval: number) {
  channels = ch;
  fillers = f;
  fillerInterval = interval;
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
