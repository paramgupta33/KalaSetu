/**
 * Studio-grade photographic lighting and color grading utility
 * Applies high-clarity contrast, warm terracotta ambient curve, and balanced studio exposure
 * to craft photographs using HTML5 Canvas.
 */
export async function applyStudioLightingFilter(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !imageSrc) {
      return resolve(imageSrc);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = img.naturalWidth || img.width || 800;
        const height = img.naturalHeight || img.height || 800;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(imageSrc);
        }

        // Apply balanced studio exposure, contrast, and color vibrancy
        ctx.filter = 'brightness(1.06) contrast(1.08) saturate(1.14)';
        ctx.drawImage(img, 0, 0, width, height);

        // Subtle warm studio ambient gradient vignette
        const centerX = width / 2;
        const centerY = height / 2;
        const innerRadius = Math.min(width, height) * 0.35;
        const outerRadius = Math.max(width, height) * 0.75;

        const ambientGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          innerRadius,
          centerX,
          centerY,
          outerRadius
        );
        ambientGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        ambientGradient.addColorStop(0.7, 'rgba(250, 245, 238, 0.04)');
        ambientGradient.addColorStop(1, 'rgba(40, 32, 28, 0.09)');

        ctx.fillStyle = ambientGradient;
        ctx.fillRect(0, 0, width, height);

        const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.94);
        resolve(enhancedDataUrl);
      } catch (err) {
        console.warn('Canvas studio enhancement fallback to original:', err);
        resolve(imageSrc);
      }
    };

    img.onerror = () => {
      resolve(imageSrc);
    };

    img.src = imageSrc;
  });
}
