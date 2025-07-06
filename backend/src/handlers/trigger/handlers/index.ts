import { fetchEroImage } from '../triggers/ero-image.js';
import { CallbackResult } from '../types.js';

export const handlesPool: Record<string, () => Promise<CallbackResult>> = {
  'random-ero-image': async () => {
    const image = await fetchEroImage();
    return {
      data: image,
      type: 'image',
    };
  },
};
