import { serve } from '@hono/node-server'
import { loadConfig } from './config.js'
import { parseM3U } from './parser.js'
import { createServer } from './server.js'
import type { ChannelState } from './types.js'


const config = loadConfig()
const channels = new Map<string, ChannelState>()

for (const ch of config.channels) {
  channels.set(ch.id, {
    config: ch,
    entries: [],
    currentIndex: 0,
    isFiller: false,
    fillerIndex: 0,
  })
}

async function loadChannelEntries() {
  for (const [, state] of channels) {
    try {
      const entries = await parseM3U(state.config.m3uUrl)
      state.entries = entries
      state.currentIndex = 0
      console.log(`[${state.config.name}] Loaded ${entries.length} entries`)
    } catch (err) {
      console.warn(`[${state.config.name}] Failed to load M3U:`, err)
    }
  }
}

function cycleChannels() {
  for (const [, state] of channels) {
    if (state.entries.length === 0) continue
    state.currentIndex = (state.currentIndex + 1) % state.entries.length
    console.log(`[${state.config.name}] Now playing: ${state.entries[state.currentIndex]?.title}`)
  }
}

async function start() {
  await loadChannelEntries()

  if (channels.size > 0) {
    setInterval(cycleChannels, 60_000 * 30)
    setInterval(loadChannelEntries, 60_000 * 60)
  }

  const app = createServer(config, channels)

  console.log(`Server starting on ${config.server.host}:${config.server.port}`)
  serve(app, (info: { port: number }) => {
    console.log(`Dashboard: http://localhost:${info.port}`)
    console.log(`M3U:       http://localhost:${info.port}/channels.m3u`)
  })
}

start().catch(console.error)
