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

### Complete Setup Instructions

#### 1. Clone & Install
```bash
git clone https://github.com/Robbdeeze/RobbdeezeNutz_Streams.git
cd RobbdeezeNutz_Streams
npm install
```

#### 2. Configure `config.json`

**Channels** — Add your M3U playlist URLs:
```json
{
  "id": "movies",
  "name": "Movies",
  "m3uUrl": "https://raw.githubusercontent.com/your-user/your-repo/main/streams/vod/movies.m3u",
  "genre": "movies",
  "fillerIntervalMs": 300000,
  "fillers": ["https://picsum.photos/1920/1080?random=1"]
}
```

**Branding** — Customize the on-screen text overlay:
```json
{
  "text": "RobbdeezeNutz",
  "fontSize": 24,
  "fontColor": "white",
  "position": "bottom-right",
  "opacity": 0.8
}
```

**Fillers** — Add filler image URLs (shows between programs):
```json
"fillers": [
  "https://picsum.photos/1920/1080?random=1",
  "https://your-server.com/promo1.jpg"
]
```

#### 3. Run

**Option A — Docker (recommended):**
```bash
docker compose up --build
```

**Option B — Local dev:**
```bash
npm run dev
```

**Option C — Build & serve:**
```bash
npm run build
npm start
```

#### 4. Add to IPTV Client

**VLC:** `Media > Open Network Stream > http://localhost:3000/channels.m3u`

**TiviMate:** Add playlist URL `http://your-server-ip:3000/channels.m3u`

**Jellyfin/Plex:** Add as M3U tuner or HDHomeRun (Tunarr-compatible)

#### 5. Watching Streams

- Click "Watch Stream" on any channel card in the dashboard
- Or open `http://localhost:3000/stream/movies` directly in VLC
- The stream includes your branding text overlay via FFmpeg

#### 6. Monitoring

- **Dashboard:** `http://localhost:3000` — see channel stats and stream status
- **API:** `http://localhost:3000/api/stats` — JSON stats for monitoring
- Channels auto-cycle every 30 minutes; M3U playlists auto-reload every 60 minutes

#### 7. Updating M3U URLs

Edit `config.json` and restart (Docker: `docker compose restart`, Local: restart the process). The server also auto-reloads M3U playlists every 60 minutes.

#### 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| "0 entries loaded" | Check `m3uUrl` is correct and reachable |
| Stream won't play | Ensure FFmpeg is installed (`ffmpeg -version`) |
| Branding not showing | Check `fontfile` path in overlay.ts matches your system |
| Docker build fails | Ensure Docker is running and you have internet |
| Port conflict | Change `server.port` in config.json |

#### 9. Current Production Channels

| Channel | Source | Entries |
|---------|--------|---------|
| Movies | `movies.m3u` | 6,349 |
| TV Shows | `tv-shows.m3u` | 6,660 |
