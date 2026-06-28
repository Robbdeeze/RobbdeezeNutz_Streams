export interface M3UEntry {
  title: string;
  url: string;
  tvgId?: string;
  tvgLogo?: string;
  groupTitle?: string;
}

export interface Filler {
  url: string;
  type: 'image' | 'video';
  duration: number;
}

export interface Channel {
  id: string;
  name: string;
  entries: M3UEntry[];
  currentIndex: number;
}

export interface Branding {
  text: string;
  color: string;
  position: string;
}

export interface Config {
  port: number;
  fillerInterval: number;
  branding: Branding;
  m3us: Array<{ name: string; url: string }>;
  fillers: Filler[];
  password?: string;
}

export interface Stats {
  totalPlays: number;
  fillerPlays: number;
}
