import { Hono } from 'hono'
import { createOverlayStream } from './overlay.js'
import type { AppConfig, ChannelState } from './types.js'

export function createServer(config: AppConfig, channels: Map<string, ChannelState>) {
  const app = new Hono()

  app.get('/', (c) => {
    return c.html(dashboardHtml(config, channels))
  })

  app.get('/channels.m3u', (c) => {
    const lines: string[] = ['#EXTM3U']
    for (const [, state] of channels) {
      const entry = state.entries[state.currentIndex]
      if (entry) {
        lines.push(`#EXTINF:-1,${state.config.name}`)
        lines.push(`/stream/${state.config.id}`)
      }
    }
    return c.text(lines.join('\n'), 200, {
      'Content-Type': 'audio/x-mpegurl',
    })
  })

  app.get('/stream/:channelId', (c) => {
    const state = channels.get(c.req.param('channelId'))
    if (!state || state.entries.length === 0) {
      return c.text('Channel not found or empty', 404)
    }

    const entry = state.entries[state.currentIndex]
    const stream = createOverlayStream(entry.url, config.branding)

    const nodeStream = stream.pipe() as NodeJS.ReadableStream

    return c.newResponse(nodeStream as unknown as ReadableStream, 200, {
      'Content-Type': 'video/MP2T',
      'Cache-Control': 'no-cache',
      'Transfer-Encoding': 'chunked',
    })
  })

  app.get('/api/stats', (c) => {
    const stats = Array.from(channels.values()).map((state) => ({
      id: state.config.id,
      name: state.config.name,
      totalEntries: state.entries.length,
      currentIndex: state.currentIndex,
      currentTitle: state.entries[state.currentIndex]?.title ?? 'Filler',
      isFiller: state.isFiller,
      entriesLoaded: state.entries.length > 0,
    }))
    return c.json(stats)
  })

  return app
}

function dashboardHtml(config: AppConfig, channels: Map<string, ChannelState>) {
  const channelCards = Array.from(channels.values()).map((state) => {
    const entry = state.entries[state.currentIndex]
    return `
    <div class="channel-card">
      <h2>${state.config.name}</h2>
      <p class="status ${state.entries.length > 0 ? 'online' : 'offline'}">
        ${state.entries.length > 0 ? 'Online' : 'No streams loaded'}
      </p>
      <p><strong>Now Playing:</strong> ${entry?.title ?? 'Filler'}</p>
      <p><strong>Items:</strong> ${state.entries.length}</p>
      <a href="/stream/${state.config.id}" target="_blank" class="btn">Watch Stream</a>
    </div>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RobbdeezeNutz Streams</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f23;
      color: #e0e0e0;
      min-height: 100vh;
    }
    .header {
      background: linear-gradient(135deg, #1a1a3e, #2a1a4e);
      padding: 2rem;
      text-align: center;
      border-bottom: 2px solid #ff6b35;
    }
    .header h1 {
      font-size: 2.5rem;
      background: linear-gradient(90deg, #ff6b35, #ffd700);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .header p { color: #8888aa; margin-top: 0.5rem; }
    .container { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
    .stats-bar {
      display: flex; gap: 2rem; justify-content: center;
      margin-bottom: 2rem; flex-wrap: wrap;
    }
    .stat {
      background: #1a1a3e; padding: 1rem 2rem; border-radius: 12px;
      text-align: center; border: 1px solid #2a2a5e;
    }
    .stat-value { font-size: 2rem; font-weight: bold; color: #ffd700; }
    .stat-label { font-size: 0.9rem; color: #8888aa; }
    .channels { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .channel-card {
      background: #1a1a3e; border-radius: 12px; padding: 1.5rem;
      border: 1px solid #2a2a5e; transition: transform 0.2s;
    }
    .channel-card:hover { transform: translateY(-4px); border-color: #ff6b35; }
    .channel-card h2 { color: #ffd700; margin-bottom: 0.5rem; }
    .status { font-weight: bold; margin-bottom: 0.5rem; }
    .online { color: #4caf50; }
    .offline { color: #f44336; }
    .btn {
      display: inline-block; margin-top: 1rem; padding: 0.5rem 1.5rem;
      background: #ff6b35; color: white; text-decoration: none;
      border-radius: 6px; font-weight: bold; transition: background 0.2s;
    }
    .btn:hover { background: #e55a2b; }
    .m3u-link {
      text-align: center; margin-top: 2rem; padding: 1rem;
      background: #1a1a3e; border-radius: 12px; border: 1px solid #2a2a5e;
    }
    .m3u-link a { color: #ff6b35; text-decoration: none; }
    .m3u-link a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <h1>RobbdeezeNutz Streams</h1>
    <p>Self-hosted VOD to linear TV channels</p>
  </div>
  <div class="container">
    <div class="stats-bar">
      <div class="stat">
        <div class="stat-value">${channels.size}</div>
        <div class="stat-label">Channels</div>
      </div>
      <div class="stat">
        <div class="stat-value">${Array.from(channels.values()).reduce((s, c) => s + c.entries.length, 0)}</div>
        <div class="stat-label">Total Streams</div>
      </div>
    </div>
    <div class="channels">${channelCards}</div>
    <div class="m3u-link">
      <p>M3U Playlist: <a href="/channels.m3u">/channels.m3u</a></p>
    </div>
  </div>
</body>
</html>`
}
