# RobbdeezeNutz_Streams — Version Records

## v0.1.0 — 2026-06-28

### Verified Working
- [x] TypeScript builds with zero errors (strict mode)
- [x] M3U parsing: **6,349 movies** + **6,660 TV shows** loaded
- [x] Dashboard served at `http://localhost:3000`
- [x] M3U playlist endpoint (`/channels.m3u`) working
- [x] Stats API (`/api/stats`) returning clean JSON
- [x] Title extraction fixed (tvg-name / last-comma fallback)
- [x] Docker build and compose configured
- [x] Pushed to GitHub (`origin/main`)

### Configuration (`config.json`)
| Key | Value |
|-----|-------|
| `server.port` | 3000 |
| `branding.text` | "RobbdeezeNutz" |
| `channels[0].name` | Movies — `movies.m3u` (6,349 entries) |
| `channels[1].name` | TV Shows — `tv-shows.m3u` (6,660 entries) |

### Description
A lightweight self-hosted tool that turns remote VOD M3U playlists into linear TV channels with fillers (AI art / promos), branding overlays, and a web dashboard.

### Tech Stack
- **Runtime:** Node.js 22 + TypeScript (ES2022)
- **Web Server:** Hono v4 + @hono/node-server
- **Video Processing:** fluent-ffmpeg (drawtext overlay)
- **HTTP Client:** undici
- **Containerization:** Docker (node:22-alpine + ffmpeg)
- **Dev Tools:** tsx (watch mode), tsc (build)

### File Structure

```
src/
├── index.ts      # Entry point: loads config, parses M3U, starts server, cycles channels
├── server.ts     # Hono web server: dashboard UI, M3U endpoint, stream proxy, stats API
├── parser.ts     # M3U playlist parser (remote fetch + text parsing, EXTINF support)
├── overlay.ts    # FFmpeg branding overlay (drawtext filter, slideshow filler support)
├── config.ts     # Config file loader (searches cwd, src/.., /config/)
└── types.ts      # TypeScript interfaces (M3UEntry, ChannelConfig, AppConfig, etc.)
config.json       # User-editable config: channels, filler URLs, branding settings
Dockerfile        # Multi-stage: npm install → tsc build → node run
docker-compose.yml # Port 3000, config.json volume mount, restart policy
package.json      # Dependencies and scripts (dev/build/start)
tsconfig.json     # ES2022, ESNext modules, strict mode
```

### Features
- Multiple channels (one per genre / M3U source)
- Remote M3U VOD playlist parsing (EXTINF metadata)
- FFmpeg branding text overlay on streams
- Filler image slideshow support (configurable image URLs)
- Web dashboard with channel cards, stats, and M3U link
- M3U playlist output for IPTV clients (VLC, TiviMate, UHF)
- Stats API endpoint (`/api/stats`)
- Periodic channel cycling (30min) and M3U reload (60min)
- Docker support with config volume mount

### Configuration (`config.json`)
| Key | Description |
|-----|-------------|
| `server.port` | Web server port (default: 3000) |
| `server.host` | Bind address (default: 0.0.0.0) |
| `branding.text` | Overlay text (default: "RobbdeezeNutz") |
| `branding.fontSize` | Font size in pixels |
| `branding.position` | Text position (top-left/right, bottom-left/right) |
| `channels[].id` | Unique channel identifier |
| `channels[].name` | Display name |
| `channels[].m3uUrl` | Remote M3U playlist URL |
| `channels[].genre` | Genre filter |
| `channels[].fillerIntervalMs` | How often to show filler content |
| `channels[].fillers` | Array of filler image URLs |

### Endpoints
| Route | Description |
|-------|-------------|
| `GET /` | Web dashboard |
| `GET /channels.m3u` | M3U playlist for IPTV clients |
| `GET /stream/:channelId` | Live MPEG-TS stream with branding overlay |
| `GET /api/stats` | JSON channel statistics |

### Usage
```bash
# Local development
npm install
npm run dev

# Docker
docker compose up --build

# Access
# Dashboard: http://localhost:3000
# M3U:      http://localhost:3000/channels.m3u
```
