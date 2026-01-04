import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'avif';
}

const DEFAULT_THUMBNAIL_OPTIONS: ThumbnailOptions = {
  width: 400,
  height: 400,
  quality: 80,
  format: 'jpeg',
};

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(
  sourcePath: string,
  options: ThumbnailOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_THUMBNAIL_OPTIONS, ...options };
  const absoluteSource = path.resolve(UPLOAD_DIR, sourcePath);

  // Generate thumbnail filename
  const ext = opts.format === 'jpeg' ? 'jpg' : opts.format;
  const baseName = path.basename(sourcePath, path.extname(sourcePath));
  const thumbDir = path.dirname(absoluteSource).replace('/originals', '/thumbnails');
  const thumbPath = path.join(thumbDir, `${baseName}_thumb.${ext}`);

  // Ensure thumbnail directory exists
  await fs.mkdir(thumbDir, { recursive: true });

  // Generate thumbnail
  const sharpInstance = sharp(absoluteSource);

  // Resize maintaining aspect ratio
  sharpInstance.resize(opts.width, opts.height, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  // Apply format-specific optimizations
  switch (opts.format) {
    case 'webp':
      sharpInstance.webp({ quality: opts.quality });
      break;
    case 'avif':
      sharpInstance.avif({ quality: opts.quality });
      break;
    default:
      sharpInstance.jpeg({ quality: opts.quality, progressive: true });
  }

  await sharpInstance.toFile(thumbPath);

  // Return relative path
  return thumbPath.replace(path.resolve(UPLOAD_DIR), '').replace(/^\//, '');
}

/**
 * Generate multiple thumbnail sizes
 */
export async function generateMultipleThumbnails(
  sourcePath: string,
  sizes: { name: string; width: number; height: number }[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const size of sizes) {
    const thumbPath = await generateThumbnail(sourcePath, {
      width: size.width,
      height: size.height,
    });
    results.set(size.name, thumbPath);
  }

  return results;
}

/**
 * Standard thumbnail sizes for the app
 */
export const THUMBNAIL_SIZES = [
  { name: 'small', width: 150, height: 150 },
  { name: 'medium', width: 400, height: 400 },
  { name: 'large', width: 800, height: 800 },
];

/**
 * Get image metadata
 */
export async function getImageMetadata(
  sourcePath: string
): Promise<{ width: number; height: number; format: string; size: number }> {
  const absolutePath = path.resolve(UPLOAD_DIR, sourcePath);
  const metadata = await sharp(absolutePath).metadata();
  const stats = await fs.stat(absolutePath);

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: stats.size,
  };
}

/**
 * Optimize image for web
 */
export async function optimizeForWeb(
  sourcePath: string,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<string> {
  const { maxWidth = 2000, maxHeight = 2000, quality = 85 } = options;
  const absoluteSource = path.resolve(UPLOAD_DIR, sourcePath);

  const metadata = await sharp(absoluteSource).metadata();

  // Skip if already small enough
  if (
    metadata.width &&
    metadata.height &&
    metadata.width <= maxWidth &&
    metadata.height <= maxHeight
  ) {
    return sourcePath;
  }

  const optimizedDir = path.dirname(absoluteSource).replace('/originals', '/optimized');
  const optimizedPath = path.join(
    optimizedDir,
    path.basename(sourcePath, path.extname(sourcePath)) + '.jpg'
  );

  await fs.mkdir(optimizedDir, { recursive: true });

  await sharp(absoluteSource)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality, progressive: true })
    .toFile(optimizedPath);

  return optimizedPath.replace(path.resolve(UPLOAD_DIR), '').replace(/^\//, '');
}

/**
 * Extract dominant color from image
 */
export async function extractDominantColor(sourcePath: string): Promise<string> {
  const absolutePath = path.resolve(UPLOAD_DIR, sourcePath);

  const { dominant } = await sharp(absolutePath)
    .resize(10, 10, { fit: 'cover' })
    .stats();

  const r = Math.round(dominant.r);
  const g = Math.round(dominant.g);
  const b = Math.round(dominant.b);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Create blur placeholder for lazy loading
 */
export async function createBlurPlaceholder(sourcePath: string): Promise<string> {
  const absolutePath = path.resolve(UPLOAD_DIR, sourcePath);

  const buffer = await sharp(absolutePath)
    .resize(20, 20, { fit: 'inside' })
    .blur(5)
    .jpeg({ quality: 50 })
    .toBuffer();

  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

/**
 * Batch process images for thumbnails
 */
export async function batchGenerateThumbnails(
  sourcePaths: string[],
  concurrency: number = 3
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Process in chunks to avoid memory issues
  for (let i = 0; i < sourcePaths.length; i += concurrency) {
    const chunk = sourcePaths.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async (sourcePath) => {
        try {
          const thumbPath = await generateThumbnail(sourcePath);
          return { sourcePath, thumbPath };
        } catch (error) {
          console.error(`Failed to generate thumbnail for ${sourcePath}:`, error);
          return { sourcePath, thumbPath: null };
        }
      })
    );

    for (const { sourcePath, thumbPath } of chunkResults) {
      if (thumbPath) {
        results.set(sourcePath, thumbPath);
      }
    }
  }

  return results;
}
