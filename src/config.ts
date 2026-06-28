import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AppConfig } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const configPaths = [
  join(process.cwd(), 'config.json'),
  join(__dirname, '..', 'config.json'),
  '/config/config.json',
]

export function loadConfig(): AppConfig {
  for (const path of configPaths) {
    if (existsSync(path)) {
      const raw = readFileSync(path, 'utf-8')
      return JSON.parse(raw) as AppConfig
    }
  }

  console.warn('No config.json found, using defaults')
  return {
    server: { port: 3000, host: '0.0.0.0' },
    branding: {
      text: 'RobbdeezeNutz',
      fontSize: 24,
      fontColor: 'white',
      position: 'bottom-right',
      opacity: 0.8,
    },
    channels: [],
    fillers: {
      slideshowDurationMs: 10000,
      imageUrl: 'https://picsum.photos/1920/1080',
    },
  }
}
