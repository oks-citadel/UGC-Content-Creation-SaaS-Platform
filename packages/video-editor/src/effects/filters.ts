/**
 * Video filter effects
 */

export interface Filter {
  name: string;
  apply: (imageData: ImageData) => ImageData;
}

export const filters = {
  brightness: (value: number): Filter => ({
    name: 'brightness',
    apply: (imageData: ImageData) => {
      const data = imageData.data;
      const factor = value * 255;

      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] + factor));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + factor));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + factor));
      }

      return imageData;
    },
  }),

  contrast: (value: number): Filter => ({
    name: 'contrast',
    apply: (imageData: ImageData) => {
      const data = imageData.data;
      const factor = (259 * (value * 255 + 255)) / (255 * (259 - value * 255));

      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
        data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
        data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
      }

      return imageData;
    },
  }),

  saturation: (value: number): Filter => ({
    name: 'saturation',
    apply: (imageData: ImageData) => {
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.2989 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = Math.min(255, Math.max(0, gray + value * (data[i] - gray)));
        data[i + 1] = Math.min(255, Math.max(0, gray + value * (data[i + 1] - gray)));
        data[i + 2] = Math.min(255, Math.max(0, gray + value * (data[i + 2] - gray)));
      }

      return imageData;
    },
  }),

  hue: (value: number): Filter => ({
    name: 'hue',
    apply: (imageData: ImageData) => {
      const data = imageData.data;
      const hueRotation = value * 360;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;

        const [h, s, l] = rgbToHsl(r, g, b);
        const newH = (h + hueRotation) % 360;
        const [newR, newG, newB] = hslToRgb(newH, s, l);

        data[i] = Math.round(newR * 255);
        data[i + 1] = Math.round(newG * 255);
        data[i + 2] = Math.round(newB * 255);
      }

      return imageData;
    },
  }),

  grayscale: (): Filter => ({
    name: 'grayscale',
    apply: (imageData: ImageData) => {
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.2989 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      return imageData;
    },
  }),

  sepia: (): Filter => ({
    name: 'sepia',
    apply: (imageData: ImageData) => {
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
        data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
        data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
      }

      return imageData;
    },
  }),

  invert: (): Filter => ({
    name: 'invert',
    apply: (imageData: ImageData) => {
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }

      return imageData;
    },
  }),

  blur: (radius: number): Filter => ({
    name: 'blur',
    apply: (imageData: ImageData) => {
      const { width, height, data } = imageData;
      const output = new ImageData(width, height);
      const outputData = output.data;

      // Simple box blur
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let r = 0,
            g = 0,
            b = 0,
            count = 0;

          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              const ny = y + dy;

              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const idx = (ny * width + nx) * 4;
                r += data[idx];
                g += data[idx + 1];
                b += data[idx + 2];
                count++;
              }
            }
          }

          const idx = (y * width + x) * 4;
          outputData[idx] = r / count;
          outputData[idx + 1] = g / count;
          outputData[idx + 2] = b / count;
          outputData[idx + 3] = data[idx + 3];
        }
      }

      return output;
    },
  }),

  sharpen: (): Filter => ({
    name: 'sharpen',
    apply: (imageData: ImageData) => {
      const { width, height, data } = imageData;
      const output = new ImageData(width, height);
      const outputData = output.data;

      // Sharpen kernel
      const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let r = 0,
            g = 0,
            b = 0;

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4;
              const kernelValue = kernel[(ky + 1) * 3 + (kx + 1)];
              r += data[idx] * kernelValue;
              g += data[idx + 1] * kernelValue;
              b += data[idx + 2] * kernelValue;
            }
          }

          const idx = (y * width + x) * 4;
          outputData[idx] = Math.min(255, Math.max(0, r));
          outputData[idx + 1] = Math.min(255, Math.max(0, g));
          outputData[idx + 2] = Math.min(255, Math.max(0, b));
          outputData[idx + 3] = data[idx + 3];
        }
      }

      return output;
    },
  }),

  vignette: (intensity: number = 0.5): Filter => ({
    name: 'vignette',
    apply: (imageData: ImageData) => {
      const { width, height, data } = imageData;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const vignette = 1 - (distance / maxDistance) * intensity;

          const idx = (y * width + x) * 4;
          data[idx] *= vignette;
          data[idx + 1] *= vignette;
          data[idx + 2] *= vignette;
        }
      }

      return imageData;
    },
  }),
};

// Helper functions
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360;

  if (s === 0) {
    return [l, l, l];
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return [r, g, b];
}
