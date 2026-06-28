import ffmpeg from 'fluent-ffmpeg';

export function createOverlayStream(inputUrl: string, brandingText: string): string {
  const output = `/tmp/stream-${Date.now()}.m3u8`;

  ffmpeg(inputUrl)
    .outputOptions([
      `-vf drawtext=text='${brandingText}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=h-th-20`,
      '-c:v libx264',
      '-preset veryfast',
      '-f hls',
      '-hls_time 10',
      '-hls_list_size 0'
    ])
    .save(output);

  return output;
}
