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
- [x] GitHub Actions CI: auto-builds Docker image to ghcr.io on every push
- [x] Fly.io deployment config (`fly.toml`) — free public URL
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
.github/workflows/
├── docker-build.yml  # GitHub Actions: auto-build & push to ghcr.io on push to main
src/
├── index.ts          # Entry point: loads config, fetches M3Us, groups by genre, starts server
├── server.ts         # Hono web server: dashboard, M3U endpoint, channel redirect, stats
├── parser.ts         # M3U playlist parser (remote fetch, EXTINF metadata extraction)
├── overlay.ts        # FFmpeg branding overlay (drawtext, HLS output)
├── slideshow.ts      # Slideshow manifest generator for filler images
├── config.ts         # Config file loader with fallback defaults
└── types.ts          # TypeScript interfaces (M3UEntry, Channel, Filler, Config, Stats)
config.json           # User-editable config: M3U sources, filler URLs, branding
Dockerfile            # node:20-slim + ffmpeg, npm install, tsc build
docker-compose.yml    # Port 3000, config.json volume mount, restart unless-stopped
fly.toml              # Fly.io deployment config (free public URL)
package.json          # Dependencies and scripts (dev/build/start)
tsconfig.json         # ES2022, ESNext modules, strict mode
```

### Features
- Multiple M3U source merging into per-source + genre-split channels
- Auto-created genre blocks (top 5 genres from M3U group-title)
- Filler/commercial injection every N plays (configurable via `fillerInterval`)
- FFmpeg branding text overlay on streams
- Web dashboard with stats and current program info
- M3U playlist output for IPTV clients (VLC, TiviMate)
- Channel redirect-based streaming (direct to M3U URLs)
- In-memory play statistics tracking
- Docker support with config volume mount
- GitHub Actions CI: auto-build & publish Docker image to ghcr.io
- Fly.io deployment ready (`fly.toml` included)

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

**On the same computer:**
- **VLC:** `Media > Open Network Stream > http://localhost:3000/channels.m3u`
- **TiviMate:** Add playlist URL `http://localhost:3000/channels.m3u`

**Other devices on your home network (TVs, phones, etc.):**
1. Find your computer's local IP:
   ```bash
   ipconfig getifaddr en0   # macOS
   # or
   hostname -I              # Linux
   ```
2. Use that IP instead of `localhost`:
   - VLC: `http://192.168.x.x:3000/channels.m3u`
   - TiviMate: same URL
   - Dashboard: `http://192.168.x.x:3000`

**People outside your home (internet):**
- Option A: [Fly.io](#9-cloud-deployment) — free, public URL, no setup on your PC **(recommended)**
- Option B: Port forward port 3000 on your router (see [Port Forwarding Guide](#port-forwarding))

#### Port Forwarding
If you want people outside your home to connect directly to your PC (no cloud service):

1. **Find your computer's local IP:**
   ```bash
   ipconfig getifaddr en0   # macOS
   # or
   hostname -I              # Linux
   # or
   ipconfig                 # Windows
   ```
   Example: `192.168.1.50`

2. **Find your public IP:**
   ```bash
   curl ifconfig.me
   ```
   Share this with others so they can connect.

3. **Log into your router** (usually `http://192.168.1.1` or `http://192.168.0.1`):
   - Find **Port Forwarding** or **Virtual Server** in the settings
   - Create a rule:
     - External Port: `3000`
     - Internal Port: `3000`
     - Internal IP: your computer's local IP (e.g. `192.168.1.50`)
     - Protocol: `TCP`

4. **Make your computer's IP static** so it doesn't change after a reboot:
   - Go to your router's **DHCP Reservation** or **Static Lease**
   - Assign `192.168.1.50` to your computer's MAC address

5. **Keep your PC running** with the server on (`docker compose up -d`)

6. **Others can now watch at:**
   ```
   http://YOUR_PUBLIC_IP:3000
   http://YOUR_PUBLIC_IP:3000/channels.m3u
   ```

**⚠️ Security note:** Port forwarding exposes your PC to the internet. Only do this if you trust everyone who gets the link. Fly.io is safer and easier.

#### 5. Watching Streams
- Open `http://localhost:3000/channel/movies` — redirects to current program
- Or `http://localhost:3000/channel/tv-shows`
- Every N plays, a random filler is served instead

#### 6. Monitoring
- **Dashboard:** `http://localhost:3000` — see channel stats and current programs
- Stats track total invocations and filler dispatches

#### 7. Updating Config
Edit `config.json` and restart:
```bash
docker compose restart   # Docker
# or restart the node process  # Local
```

#### 8. Local vs Cloud — Which Should You Use?

| | Local (docker/npm) | Cloud (Fly.io/Railway) |
|-|-------------------|----------------------|
| **Who can watch?** | You + your home network | Anyone on the internet |
| **Cost** | Free | Free (Fly.io free tier) |
| **Setup time** | Instant | 5 minutes, needs credit card |
| **Your PC must stay on?** | Yes | No |
| **Best for** | Testing, personal use | Sharing with friends/family |

Start local to test. If you want people outside your house to watch, use Fly.io.

### CI/CD Pipeline (GitHub → Fly.io)
Every push to `main` automatically:
1. Builds Docker image → pushes to `ghcr.io/robbdeeze/robbdeezenutz_streams:latest`
2. Deploys to Fly.io → updates your public URL

#### 9. Cloud Deployment

**Fly.io (free — recommended):** Fully automated from GitHub.

**One-time setup (run from your computer once):**
```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh

# 2. Sign up (free, requires credit card for identity verification, no charges)
flyctl auth signup

# 3. Create the Fly.io app
flyctl launch --copy-config --no-deploy

# 4. Generate API token
flyctl auth token
# → Copy the output token string

# 5. Add token to GitHub
#    Go to: GitHub repo → Settings → Secrets and variables → Actions
#    Click "New repository secret"
#    Name: FLY_API_TOKEN
#    Value: paste the token from step 4
```

**After setup — fully automatic:**
```
git push → GitHub Actions builds → deploys to Fly.io
```

**Your public URLs:**
```
Dashboard: https://robbdeezenutz-streams.fly.dev
M3U:       https://robbdeezenutz-streams.fly.dev/channels.m3u
Channel:   https://robbdeezenutz-streams.fly.dev/channel/movies
```

**In VLC/TiviMate:** Use the M3U URL above instead of `localhost`.

**Railway (alternative — also free, no credit card needed):**
1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Select this repo, set port to 3000
4. Auto-deploys on every push, no setup needed

#### 10. Troubleshooting
| Problem | Fix |
|---------|-----|
| "0 entries loaded" | Check M3U URLs are correct and reachable |
| Fillers not playing | Add filler URLs to `fillers` array in config |
| Docker build fails | Ensure Docker is running and has internet |
| Port conflict | Change `port` in config.json |
| Fly.io deploy fails | Run `flyctl launch --copy-config` first |
