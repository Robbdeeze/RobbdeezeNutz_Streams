export interface M3UEntry {
  title: string
  duration: number
  url: string
  genre?: string
  logo?: string
}

export interface ChannelConfig {
  id: string
  name: string
  m3uUrl: string
  genre: string
  fillerIntervalMs: number
  fillers: string[]
}

export interface BrandingConfig {
  text: string
  fontSize: number
  fontColor: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  opacity: number
}

export interface ServerConfig {
  port: number
  host: string
}

export interface AppConfig {
  server: ServerConfig
  branding: BrandingConfig
  channels: ChannelConfig[]
  fillers: {
    slideshowDurationMs: number
    imageUrl: string
  }
}

export interface ChannelState {
  config: ChannelConfig
  entries: M3UEntry[]
  currentIndex: number
  isFiller: boolean
  fillerIndex: number
}
