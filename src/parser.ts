import { request } from 'undici'
import type { M3UEntry } from './types.js'

export async function parseM3U(url: string): Promise<M3UEntry[]> {
  if (!url) return []

  const response = await request(url)
  const body = await response.body.text()
  return parseM3UText(body)
}

export function parseM3UText(content: string): M3UEntry[] {
  const entries: M3UEntry[] = []
  const lines = content.split('\n')

  let currentExtInf: Partial<M3UEntry> | null = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line === '#EXTM3U') continue

    if (line.startsWith('#EXTINF:')) {
      const durationMatch = line.match(
        /#EXTINF:(-?\d+(?:\.\d+)?)/
      )
      const duration = durationMatch ? parseFloat(durationMatch[1]) : 0

      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/)
      const genreMatch = line.match(/group-title="([^"]*)"/)
      const logoMatch = line.match(/tvg-logo="([^"]*)"/)

      const lastComma = line.lastIndexOf(',')
      const rawTitle = lastComma !== -1 ? line.slice(lastComma + 1).trim() : 'Unknown'
      const title = tvgNameMatch?.[1] ?? rawTitle

      currentExtInf = {
        title,
        duration: duration < 0 ? 0 : duration,
        genre: genreMatch?.[1],
        logo: logoMatch?.[1],
      }
    } else if (!line.startsWith('#') && currentExtInf) {
      entries.push({
        title: currentExtInf.title ?? 'Unknown',
        duration: currentExtInf.duration ?? 0,
        url: line,
        genre: currentExtInf.genre,
        logo: currentExtInf.logo,
      })
      currentExtInf = null
    }
  }

  return entries
}
