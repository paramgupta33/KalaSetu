/**
 * Client-Side Image Compression & Optimization Utility
 * 
 * Compresses and resizes high-resolution camera / gallery uploads before transmission to
 * Supabase Storage and API endpoints. Converts to WebP format (0.85 quality) and scales to a max 1200px boundary.
 * 
 * Preserves high visual fidelity for handicrafts (weaves, wood grain, clay glazes)
 * while reducing transfer payload by 90-97% (from 5-10MB raw photos to ~100-200KB).
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
}

/**
 * Resizes and compresses an image data URL or image source URL using HTML5 Canvas.
 */
export async function compressAndResizeImage(
  imageSource: string | File | Blob,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85,
    format = 'image/webp',
  } = options;

  if (typeof window === 'undefined') {
    if (typeof imageSource === 'string') return imageSource;
    return '';
  }

  // If already a small data URL or string under 80KB, skip heavy processing unless format conversion desired
  if (typeof imageSource === 'string' && imageSource.startsWith('data:image/webp') && imageSource.length < 100000) {
    return imageSource;
  }

  let srcUrl = '';
  let shouldRevoke = false;

  if (typeof imageSource === 'string') {
    srcUrl = imageSource;
  } else {
    srcUrl = URL.createObjectURL(imageSource);
    shouldRevoke = true;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const cleanup = () => {
      if (shouldRevoke && srcUrl) {
        URL.revokeObjectURL(srcUrl);
      }
    };

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width || 800;
        let height = img.naturalHeight || img.height || 800;

        // Calculate proportional scale factor
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: format === 'image/webp' || format === 'image/png' });
        if (!ctx) {
          cleanup();
          return resolve(typeof imageSource === 'string' ? imageSource : srcUrl);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw downscaled image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG if WebP export is unsupported
        let resultDataUrl = '';
        try {
          resultDataUrl = canvas.toDataURL(format, quality);
          // Some older engines return data:image/png when format is unsupported
          if (format === 'image/webp' && !resultDataUrl.startsWith('data:image/webp')) {
            resultDataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          resultDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }

        cleanup();
        resolve(resultDataUrl);
      } catch (err) {
        console.warn('[imageCompress] Canvas compression fallback:', err);
        cleanup();
        resolve(typeof imageSource === 'string' ? imageSource : srcUrl);
      }
    };

    img.onerror = () => {
      cleanup();
      resolve(typeof imageSource === 'string' ? imageSource : srcUrl);
    };

    img.src = srcUrl;
  });
}
