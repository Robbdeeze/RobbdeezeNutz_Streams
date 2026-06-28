import { readFileSync } from 'fs';
import type { Config } from './types.js';

export function loadConfig(): Config {
  try {
    const data = readFileSync('config.json', 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load config.json — using default fallback configuration profile.');
    return {
      port: 3000,
      fillerInterval: 5,
      branding: { text: "RobbdeezeNutz_Streams", color: "white", position: "bottom" },
      m3us: [],
      fillers: []
    };
  }
}
