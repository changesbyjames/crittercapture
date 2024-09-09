import ffmpeg from 'fluent-ffmpeg';
import { spawn } from 'node:child_process';
import { useEnvironment } from './utils/env/env.js';
import { DownstreamError, handleDanglingError } from './utils/errors.js';

export const startSnapshots = (directory: string, url: string, fps: number, runId: string) => {
  return new Promise<AsyncDisposable>((resolve, reject) => {
    let cleaningUp = false;
    console.log(`Connecting to ${url}`);
    console.log(`Starting ffmpeg`);
    const command = ffmpeg(url);
    command
      .videoFilters(`fps=${fps}`)
      .outputOptions('-q:v 1')
      .output(`${directory}/sc_${runId}_%06d.png`)
      .on('end', () => {
        if (cleaningUp) return;
        handleDanglingError(
          new DownstreamError('api', `Stream ended or disconnected. It could be a stream reset or a connection issue.`)
        );
      })
      .on('error', err => {
        reject(new DownstreamError('api', err.message));
      })
      .on('start', () => {
        console.log(`Started ffmpeg. Screenshots being taken at ${fps}fps and saved to ${directory}`);
        resolve({
          [Symbol.asyncDispose]: async () => {
            cleaningUp = true;
            console.log('Cleaning up ffmpeg');
            command.kill('SIGKILL');
            console.log('Cleaned up ffmpeg');
          }
        });
      })
      .run();
  });
};

export const initialize = async (): Promise<AsyncDisposable & { url: string }> => {
  const { variables } = useEnvironment();
  const url = new URL(variables.STREAM_URL);

  if (url.hostname === 'twitch.tv') {
    if (!variables.TWITCH_API_TOKEN) {
      throw new Error(
        'If you are using twitch, you must provide a TWITCH_API_TOKEN or the stream will either not be captured or get ads. Get it here: https://streamlink.github.io/cli/plugins/twitch.html#authentication'
      );
    }
    return await initializeTwitchStream(variables.STREAM_URL, variables.TWITCH_API_TOKEN);
  }

  return {
    [Symbol.asyncDispose]: async () => {
      console.log(`Nothing to clean up when consuming a stream directly.`);
    },
    url: url.toString()
  };
};

export const initializeTwitchStream = (url: string, token: string) => {
  return new Promise<AsyncDisposable & { url: string }>(async (resolve, reject) => {
    let cleaningUp = false;

    console.log(`Twitch stream URL found. Logging in & converting to raw stream.`);
    console.log(`Starting streamlink`);
    const child = spawn('streamlink', [
      `--twitch-api-header=Authorization=OAuth ${token}`,
      '--twitch-low-latency',
      '--player-external-http',
      url,
      'best'
    ]);

    child.on('spawn', () => {
      console.log(`Started streamlink`);
    });
    const RegexForURL = /http:\/\/[^ ]+\//;

    child.stdout.on('data', data => {
      const match = RegexForURL.exec(data.toString());
      if (!match) return;

      const url = match[0].trim();
      console.log(`Stream URL found: ${url}`);
      resolve({
        [Symbol.asyncDispose]: async () => {
          cleaningUp = true;
          console.log('Cleaning up streamlink');
          if (child.kill()) {
            console.log('Streamlink was killed successfully');
            return;
          }

          console.warn('Streamlink did not exit properly');
        },
        url
      });
    });

    child.stderr.on('data', data => {
      console.error(`stderr: ${data}`);
    });

    child.on('close', code => {
      console.log(`Streamlink exited with code ${code}`);
      if (cleaningUp) return;
      handleDanglingError(new DownstreamError('streamlink', `Streamlink exited with code ${code}`));
    });
  });
};
