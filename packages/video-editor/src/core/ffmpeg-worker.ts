/**
 * FFmpeg Web Worker for background video processing
 * This allows video rendering to happen without blocking the main thread
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let isLoaded = false;

interface WorkerMessage {
  type: 'init' | 'render' | 'terminate';
  payload?: any;
}

interface WorkerResponse {
  type: 'ready' | 'progress' | 'complete' | 'error';
  payload?: any;
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'init':
        await initializeFFmpeg();
        postMessage({ type: 'ready' });
        break;

      case 'render':
        await renderVideo(payload);
        break;

      case 'terminate':
        await terminateFFmpeg();
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    postMessage({
      type: 'error',
      payload: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

async function initializeFFmpeg(): Promise<void> {
  if (isLoaded) return;

  ffmpeg = new FFmpeg();

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg Worker]', message);
  });

  ffmpeg.on('progress', ({ progress, time }) => {
    postMessage({
      type: 'progress',
      payload: { progress: progress * 100, time },
    });
  });

  isLoaded = true;
}

async function renderVideo(data: any): Promise<void> {
  if (!ffmpeg || !isLoaded) {
    throw new Error('FFmpeg not initialized');
  }

  const { inputFiles, command } = data;

  // Write input files
  for (const [filename, fileData] of Object.entries(inputFiles)) {
    await ffmpeg.writeFile(filename, new Uint8Array(fileData as ArrayBuffer));
  }

  // Execute FFmpeg command
  await ffmpeg.exec(command);

  // Read output
  const outputData = await ffmpeg.readFile('output.mp4');

  // Send result back to main thread
  postMessage({
    type: 'complete',
    payload: outputData,
  });

  // Cleanup
  for (const filename of Object.keys(inputFiles)) {
    try {
      await ffmpeg.deleteFile(filename);
    } catch (error) {
      console.warn('Failed to delete file:', filename);
    }
  }

  try {
    await ffmpeg.deleteFile('output.mp4');
  } catch (error) {
    console.warn('Failed to delete output file');
  }
}

async function terminateFFmpeg(): Promise<void> {
  if (ffmpeg && isLoaded) {
    await ffmpeg.terminate();
    ffmpeg = null;
    isLoaded = false;
  }
}

// Export empty object to satisfy TypeScript module requirements
export {};
