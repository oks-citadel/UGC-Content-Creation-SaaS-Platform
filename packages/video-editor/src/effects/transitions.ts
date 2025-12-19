/**
 * Transition effects between video clips
 */

export interface Transition {
  name: string;
  apply: (
    fromFrame: ImageData,
    toFrame: ImageData,
    progress: number
  ) => ImageData;
}

export const transitions = {
  fade: (): Transition => ({
    name: 'fade',
    apply: (fromFrame: ImageData, toFrame: ImageData, progress: number) => {
      const output = new ImageData(fromFrame.width, fromFrame.height);
      const fromData = fromFrame.data;
      const toData = toFrame.data;
      const outData = output.data;

      for (let i = 0; i < fromData.length; i += 4) {
        outData[i] = fromData[i] * (1 - progress) + toData[i] * progress;
        outData[i + 1] = fromData[i + 1] * (1 - progress) + toData[i + 1] * progress;
        outData[i + 2] = fromData[i + 2] * (1 - progress) + toData[i + 2] * progress;
        outData[i + 3] = 255;
      }

      return output;
    },
  }),

  dissolve: (): Transition => ({
    name: 'dissolve',
    apply: (fromFrame: ImageData, toFrame: ImageData, progress: number) => {
      const output = new ImageData(fromFrame.width, fromFrame.height);
      const fromData = fromFrame.data;
      const toData = toFrame.data;
      const outData = output.data;

      // Random dissolve with seeded randomness for consistency
      for (let i = 0; i < fromData.length; i += 4) {
        const pixelProgress = (Math.sin(i * 0.001) + 1) / 2;
        const blend = pixelProgress < progress ? 1 : 0;

        outData[i] = fromData[i] * (1 - blend) + toData[i] * blend;
        outData[i + 1] = fromData[i + 1] * (1 - blend) + toData[i + 1] * blend;
        outData[i + 2] = fromData[i + 2] * (1 - blend) + toData[i + 2] * blend;
        outData[i + 3] = 255;
      }

      return output;
    },
  }),

  wipeLeft: (): Transition => ({
    name: 'wipe-left',
    apply: (fromFrame: ImageData, toFrame: ImageData, progress: number) => {
      const output = new ImageData(fromFrame.width, fromFrame.height);
      const { width, height } = fromFrame;
      const fromData = fromFrame.data;
      const toData = toFrame.data;
      const outData = output.data;

      const wipePosition = width * progress;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const isWiped = x < wipePosition;

          if (isWiped) {
            outData[idx] = toData[idx];
            outData[idx + 1] = toData[idx + 1];
            outData[idx + 2] = toData[idx + 2];
          } else {
            outData[idx] = fromData[idx];
            outData[idx + 1] = fromData[idx + 1];
            outData[idx + 2] = fromData[idx + 2];
          }
          outData[idx + 3] = 255;
        }
      }

      return output;
    },
  }),

  wipeRight: (): Transition => ({
    name: 'wipe-right',
    apply: (fromFrame: ImageData, toFrame: ImageData, progress: number) => {
      const output = new ImageData(fromFrame.width, fromFrame.height);
      const { width, height } = fromFrame;
      const fromData = fromFrame.data;
      const toData = toFrame.data;
      const outData = output.data;

      const wipePosition = width * (1 - progress);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const isWiped = x > wipePosition;

          if (isWiped) {
            outData[idx] = toData[idx];
            outData[idx + 1] = toData[idx + 1];
            outData[idx + 2] = toData[idx + 2];
          } else {
            outData[idx] = fromData[idx];
            outData[idx + 1] = fromData[idx + 1];
            outData[idx + 2] = fromData[idx + 2];
          }
          outData[idx + 3] = 255;
        }
      }

      return output;
    },
  }),

  wipeUp: (): Transition => ({
    name: 'wipe-up',
    apply: (fromFrame: ImageData, toFrame: ImageData, progress: number) => {
      const output = new ImageData(fromFrame.width, fromFrame.height);
      const { width, height } = fromFrame;
      const fromData = fromFrame.data;
      const toData = toFrame.data;
      const outData = output.data;

      const wipePosition = height * (1 - progress);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const isWiped = y > wipePosition;

          if (isWiped) {
            outData[idx] = toData[idx];
            outData[idx + 1] = toData[idx + 1];
            outData[idx + 2] = toData[idx + 2];
          } else {
            outData[idx] = fromData[idx];
            outData[idx + 1] = fromData[idx + 1];
            outData[idx + 2] = fromData[idx + 2];
          }
          outData[idx + 3] = 255;
        }
      }

      return output;
    },
  }),

  wipeDown: (): Transition => ({
    name: 'wipe-down',
    apply: (fromFrame: ImageData, toFrame: ImageData, progress: number) => {
      const output = new ImageData(fromFrame.width, fromFrame.height);
      const { width, height } = fromFrame;
      const fromData = fromFrame.data;
      const toData = toFrame.data;
      const outData = output.data;

      const wipePosition = height * progress;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const isWiped = y < wipePosition;

          if (isWiped) {
            outData[idx] = toData[idx];
            outData[idx + 1] = toData[idx + 1];
            outData[idx + 2] = toData[idx + 2];
          } else {
            outData[idx] = fromData[idx];
            outData[idx + 1] = fromData[idx + 1];
            outData[idx + 2] = fromData[idx + 2];
          }
          outData[idx + 3] = 255;
        }
      }

      return output;
    },
  }),

  slideLeft: (): Transition => ({
    name: 'slide-left',
    apply: (fromFrame: ImageData, toFrame: ImageData, progress: number) => {
      const output = new ImageData(fromFrame.width, fromFrame.height);
      const { width, height } = fromFrame;
      const fromData = fromFrame.data;
      const toData = toFrame.data;
      const outData = output.data;

      const offset = Math.floor(width * progress);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const sourceX = x + offset;

          if (sourceX < width) {
            const sourceIdx = (y * width + sourceX) * 4;
            outData[idx] = fromData[sourceIdx];
            outData[idx + 1] = fromData[sourceIdx + 1];
            outData[idx + 2] = fromData[sourceIdx + 2];
          } else {
            const sourceIdx = (y * width + (sourceX - width)) * 4;
            outData[idx] = toData[sourceIdx];
            outData[idx + 1] = toData[sourceIdx + 1];
            outData[idx + 2] = toData[sourceIdx + 2];
          }
          outData[idx + 3] = 255;
        }
      }

      return output;
    },
  }),

  zoom: (): Transition => ({
    name: 'zoom',
    apply: (fromFrame: ImageData, toFrame: ImageData, progress: number) => {
      const output = new ImageData(fromFrame.width, fromFrame.height);
      const { width, height } = fromFrame;
      const fromData = fromFrame.data;
      const toData = toFrame.data;
      const outData = output.data;

      const scale = 1 + progress * 2;
      const centerX = width / 2;
      const centerY = height / 2;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;

          // Calculate source coordinates for zoom
          const srcX = Math.floor(centerX + (x - centerX) / scale);
          const srcY = Math.floor(centerY + (y - centerY) / scale);

          if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
            const srcIdx = (srcY * width + srcX) * 4;
            const blend = progress;

            outData[idx] = fromData[srcIdx] * (1 - blend) + toData[idx] * blend;
            outData[idx + 1] = fromData[srcIdx + 1] * (1 - blend) + toData[idx + 1] * blend;
            outData[idx + 2] = fromData[srcIdx + 2] * (1 - blend) + toData[idx + 2] * blend;
          } else {
            outData[idx] = toData[idx];
            outData[idx + 1] = toData[idx + 1];
            outData[idx + 2] = toData[idx + 2];
          }
          outData[idx + 3] = 255;
        }
      }

      return output;
    },
  }),

  crossZoom: (): Transition => ({
    name: 'cross-zoom',
    apply: (fromFrame: ImageData, toFrame: ImageData, progress: number) => {
      const output = new ImageData(fromFrame.width, fromFrame.height);
      const { width, height } = fromFrame;
      const fromData = fromFrame.data;
      const toData = toFrame.data;
      const outData = output.data;

      const fromScale = 1 + progress;
      const toScale = 1 + (1 - progress);
      const centerX = width / 2;
      const centerY = height / 2;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;

          // From frame zooms out
          const fromX = Math.floor(centerX + (x - centerX) * fromScale);
          const fromY = Math.floor(centerY + (y - centerY) * fromScale);

          // To frame zooms in
          const toX = Math.floor(centerX + (x - centerX) / toScale);
          const toY = Math.floor(centerY + (y - centerY) / toScale);

          let fr = 0,
            fg = 0,
            fb = 0;
          if (fromX >= 0 && fromX < width && fromY >= 0 && fromY < height) {
            const fromIdx = (fromY * width + fromX) * 4;
            fr = fromData[fromIdx];
            fg = fromData[fromIdx + 1];
            fb = fromData[fromIdx + 2];
          }

          let tr = 0,
            tg = 0,
            tb = 0;
          if (toX >= 0 && toX < width && toY >= 0 && toY < height) {
            const toIdx = (toY * width + toX) * 4;
            tr = toData[toIdx];
            tg = toData[toIdx + 1];
            tb = toData[toIdx + 2];
          }

          outData[idx] = fr * (1 - progress) + tr * progress;
          outData[idx + 1] = fg * (1 - progress) + tg * progress;
          outData[idx + 2] = fb * (1 - progress) + tb * progress;
          outData[idx + 3] = 255;
        }
      }

      return output;
    },
  }),
};
