import ffmpeg from 'fluent-ffmpeg'
import type { BrandingConfig } from './types.js'

const POSITION_MAP: Record<string, string> = {
  'top-left': '10:10',
  'top-right': 'W-tw-10:10',
  'bottom-left': '10:H-th-10',
  'bottom-right': 'W-tw-10:H-th-10',
}

function drawTextFilter(branding: BrandingConfig): string {
  const pos = POSITION_MAP[branding.position] ?? POSITION_MAP['bottom-right']
  const escaped = branding.text.replace(/'/g, "'\\\\\\''")
  const parts = [
    `drawtext=text='${escaped}'`,
    `fontsize=${branding.fontSize}`,
    `fontcolor=${branding.fontColor}@${branding.opacity}`,
    `x=${pos.split(':')[0]}`,
    `y=${pos.split(':')[1]}`,
    `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`,
  ]
  return parts.join(':')
}

export function createOverlayStream(
  videoUrl: string,
  branding: BrandingConfig,
): ffmpeg.FfmpegCommand {
  return ffmpeg(videoUrl)
    .inputOption('-re')
    .videoFilter(drawTextFilter(branding))
    .outputOption('-preset ultrafast')
    .outputOption('-crf 23')
    .outputOption('-c:v libx264')
    .outputOption('-c:a aac')
    .format('mpegts')
}

export function createSlideshowStream(
  imageUrls: string[],
  durationMs: number,
  branding: BrandingConfig,
): ffmpeg.FfmpegCommand {
  const perImage = Math.max(5, Math.floor(durationMs / 1000 / imageUrls.length))

  const command = ffmpeg()
  for (const url of imageUrls) {
    command.input(url).inputOption(['-loop', '1', '-t', String(perImage)])
  }

  const labels = imageUrls.map((_, i) => `[${i}:v]`)
  const scaled = labels.map((l, i) =>
    `${l}scale=1920:1080,setsar=1,fps=24,setpts=PTS-STARTPTS[v${i}]`
  )
  const concat = imageUrls.map((_, i) => `[v${i}]`).join('')
  scaled.push(
    `${concat}concat=n=${imageUrls.length}:v=1:a=0,${drawTextFilter(branding)}[out]`
  )

  return command
    .complexFilter(scaled, ['[out]'])
    .outputOption('-map [out]')
    .outputOption('-c:v libx264')
    .outputOption('-preset ultrafast')
    .outputOption('-crf 23')
    .format('mpegts')
}
