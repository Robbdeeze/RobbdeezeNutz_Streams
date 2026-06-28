import type { Filler } from './types.js';

export function generateSlideshowManifest(images: Filler[]): string {
  console.log(`Generating slideshow configuration for ${images.length} art assets.`);
  return "/tmp/slideshow.m3u8";
}
