import ffmpeg from 'fluent-ffmpeg';
import { spawn } from 'node:child_process';

export const startSnapshots = (directory: string, url: string, fps: number, runId: string) => {
  return new Promise<void>((resolve, reject) => {
    console.log(`Connecting to ${url}`);
    console.log(`Starting ffmpeg`);
    ffmpeg(url)
      .videoFilters(`fps=${fps}`)
      .outputOptions('-q:v 1')
      .output(`${directory}/sc_${runId}_%06d.png`)
      .on('end', () => {
        console.log('Processing finished!');
      })
      .on('error', err => {
        console.error('An error occurred: ' + err.message);
        reject(err);
      })
      .on('start', () => {
        console.log(`Started ffmpeg. Screenshots being taken at ${fps}fps and saved to ${directory}`);
        resolve();
      })
      .run();
  });
};

type CleanupFunction = () => Promise<void>;

export const initializeStream = async (): Promise<[string, CleanupFunction]> => {
  if (!process.env.STREAM_URL) {
    throw new Error('STREAM_URL is not set');
  }
  const url = new URL(process.env.STREAM_URL);

  if (url.hostname === 'twitch.tv') {
    return await initializeTwitchStream(process.env.STREAM_URL);
  }

  return [
    process.env.STREAM_URL,
    async () => {
      console.log(`Nothing to clean up for ${process.env.STREAM_URL}`);
    }
  ];
};

export const initializeTwitchStream = (url: string) => {
  return new Promise<[string, CleanupFunction]>(async (resolve, reject) => {
    console.log(`Twitch stream URL found. Logging in & converting to raw stream.`);
    console.log(`Starting streamlink`);
    const child = spawn('streamlink', [
      `--twitch-api-header=Authorization=OAuth ${process.env.TWITCH_API_TOKEN}`,
      '--twitch-low-latency',
      '--player-external-http',
      url,
      'best'
    ]);

    child.on('spawn', () => {
      console.log(`Started streamlink`);
    });
    /*
      Example output:
      [cli][info] Found matching plugin twitch for URL https://twitch.tv/alveussanctuary
      [cli][info] Available streams: audio_only, 160p (worst), 360p, 480p, 720p, 720p60, 1080p60 (best)
      [cli][info] Starting server, access with one of:
      [cli][info]  http://127.0.0.1:52161/
      [cli][info]  http://192.168.1.114:52161/
      [cli][info]  http://192.168.247.0:52161/
      [cli][info]  http://198.19.249.3:52161/
    */

    const RegexForURL = /http:\/\/[^ ]+\//;

    child.stdout.on('data', data => {
      const match = RegexForURL.exec(data.toString());
      if (!match) return;

      const url = match[0].trim();
      console.log(`Stream URL found: ${url}`);
      resolve([
        url,
        async () => {
          console.log('Killing streamlink');
          const killed = child.kill();
          if (killed) {
            console.log('Streamlink killed');
          } else {
            console.warn('Streamlink did not exit properly');
          }
        }
      ]);
    });

    child.stderr.on('data', data => {
      console.error(`stderr: ${data}`);
    });

    child.on('close', code => {
      console.log(`streamlink exited with code ${code}`);
    });
  });
};
