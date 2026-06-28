# RobbdeezeNutz_Streams — Version Records

## v0.1.0 — 2026-06-28

### Description
A lightweight self-hosted utility designed to transform remote VOD M3U playlists into linear TV channels. Features automatic filler/commercial injection, FFmpeg branding overlays, and an in-memory statistics hub.

### Verified Working
- [x] TypeScript builds with zero errors (strict mode)
- [x] M3U parsing: **6,349 movies** + **6,660 TV shows** loaded = **13,009 total entries**
- [x] Auto-generates **12+ channels** — per-source main + top 5 genre blocks
- [x] Movies and TV Shows kept separate with distinct channel groups
- [x] Placeholder channel ready for **Black TV Shows** (add URL in config.json)
- [x] Dashboard served at `http://localhost:3000`
- [x] M3U playlist endpoint (`/channels.m3u`) working
- [x] Filler/commercial injection every N plays (configurable)
- [x] Play stats tracking (total plays + filler plays)
- [x] Docker build and compose configured
- [x] Pushed to GitHub (`origin/main`)

### Tech Stack
- **Runtime:** Node.js 20 + TypeScript (ES2022)
- **Web Server:** Hono v4 + @hono/node-server v1
- **Video Processing:** fluent-ffmpeg (drawtext overlay)
- **HTTP Client:** undici
- **Containerization:** Docker (node:20-slim + ffmpeg via apt)
- **Dev Tools:** tsx (watch mode), tsc (build)

### File Structure
```
src/
├── index.ts      # Entry point: loads config, fetches M3Us, groups by genre, starts server
├── server.ts     # Hono web server: dashboard, M3U endpoint, channel redirect, stats
├── parser.ts     # M3U playlist parser (remote fetch, EXTINF metadata extraction)
├── overlay.ts    # FFmpeg branding overlay (drawtext, HLS output)
├── slideshow.ts  # Slideshow manifest generator for filler images
├── config.ts     # Config file loader with fallback defaults
└── types.ts      # TypeScript interfaces (M3UEntry, Channel, Filler, Config, Stats)
config.json       # User-editable config: M3U sources, filler URLs, branding
Dockerfile        # node:20-slim + ffmpeg, npm install, tsc build
docker-compose.yml # Port 3000, config.json volume mount, restart unless-stopped
package.json      # Dependencies and scripts (dev/build/start)
tsconfig.json     # ES2022, ESNext modules, strict mode
```

### Features
- Multiple M3U source merging into unified + genre-split channels
- Auto-created genre blocks (top 5 genres from M3U group-title)
- Filler/commercial injection every N plays (configurable via `fillerInterval`)
- FFmpeg branding text overlay on streams
- Web dashboard with stats and current program info
- M3U playlist output for IPTV clients (VLC, TiviMate)
- Channel redirect-based streaming (direct to M3U URLs)
- In-memory play statistics tracking
- Docker support with config volume mount

### Configuration (`config.json`)

#### Top-level
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `port` | number | 3000 | Web server port |
| `fillerInterval` | number | 4 | Play a filler every N items (0-based: every 5th play) |
| `branding` | object | — | Text overlay settings |
| `m3us` | array | [] | M3U playlist sources |
| `fillers` | array | [] | Filler/commercial assets |

#### `branding`
| Key | Type | Description |
|-----|------|-------------|
| `text` | string | Overlay text (e.g. "RobbdeezeNutz_Streams") |
| `color` | string | Font color (e.g. "white") |
| `position` | string | Text position (e.g. "bottom") |

#### `m3us[]`
| Key | Type | Description |
|-----|------|-------------|
| `name` | string | Display name for the source |
| `url` | string | Remote M3U playlist URL |

#### `fillers[]`
| Key | Type | Description |
|-----|------|-------------|
| `url` | string | Filler asset URL (image or video) |
| `type` | string | "image" or "video" |
| `duration` | number | Duration in seconds |

### Endpoints
| Route | Description |
|-------|-------------|
| `GET /` | Web dashboard with stats and channel listing |
| `GET /channels.m3u` | M3U playlist for IPTV clients |
| `GET /channel/:id` | Redirects to current program or random filler |

### Auto-Generated Channels
Each M3U source gets its own main channel + top 5 genre blocks:

| Source | Main Channel | Genre Blocks |
|--------|-------------|--------------|
| Movies | Movies | Action, Adventure, Animation, Comedy, Crime |
| TV Shows | TV Shows | 13 Reasons Why, 15 Days, 3 Body Problem, 30 Coins, 50M² |
| Black TV Shows | *(placeholder — add URL)* | *(auto-generated)* |

### Filler Injection Logic
- Every `fillerInterval + 1` plays, a random filler is served instead of a program
- Tracked via `stats.totalPlays` and `stats.fillerPlays`
- Dashboard shows when filler is active: `[COMMERCIAL/AI ART FILLER]`

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

**M3U Sources** — Add your playlist URLs:
```json
"m3us": [
  { "name": "Movies", "url": "https://example.com/movies.m3u" },
  { "name": "TV Shows", "url": "https://example.com/tv-shows.m3u" }
]
```

**Branding** — Customize the on-screen text overlay:
```json
"branding": {
  "text": "RobbdeezeNutz_Streams",
  "color": "white",
  "position": "bottom"
}
```

**Fillers** — Add filler/commercial assets:
```json
"fillers": [
  { "url": "https://example.com/ai-art-1.jpg", "type": "image", "duration": 30 },
  { "url": "https://example.com/promo.mp4", "type": "video", "duration": 60 }
]
```

#### 3. Run
```bash
# Option A — Docker (recommended)
docker compose up --build

# Option B — Local dev
npm run dev

# Option C — Build & serve
npm run build && npm start
```

#### 4. Add to IPTV Client
- **VLC:** `Media > Open Network Stream > http://localhost:3000/channels.m3u`
- **TiviMate:** Add playlist URL `http://your-server-ip:3000/channels.m3u`

#### 5. Watching Streams
- Open `http://localhost:3000/channel/main` — redirects to current program
- Every N plays, a random filler is served instead

#### 6. Monitoring
- **Dashboard:** `http://localhost:3000` — see channel stats and stream status
- Stats track total invocations and filler dispatches

#### 7. Updating Config
Edit `config.json` and restart:
```bash
docker compose restart   # Docker
# or restart the node process  # Local
```

#### 8. Troubleshooting
| Problem | Fix |
|---------|-----|
| "0 entries loaded" | Check M3U URLs are correct and reachable |
| Fillers not playing | Add filler URLs to `fillers` array in config |
| Docker build fails | Ensure Docker is running and has internet |
| Port conflict | Change `port` in config.json |
