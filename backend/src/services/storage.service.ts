import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import crypto from 'crypto';
import { config } from '../config';
import logger from '../utils/logger';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${config.storage.r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.storage.r2AccessKeyId,
    secretAccessKey: config.storage.r2SecretAccessKey,
  },
});

const IMAGE_SIZES = {
  logo: { width: 400, height: 400 },
  cover: { width: 1200, height: 400 },
  gallery: { width: 1200, height: 800 },
  blog: { width: 1200, height: 630 },
};

export const storageService = {
  async uploadCompanyMedia(
    userId: string,
    type: 'logo' | 'cover' | 'gallery' | 'blog',
    file: Express.Multer.File
  ): Promise<string> {
    const ext = 'webp';
    const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
    const key = `companies/${userId}/${type}/${filename}`;

    // Process image with Sharp
    const dimensions = IMAGE_SIZES[type];
    const processedBuffer = await sharp(file.buffer)
      .resize(dimensions.width, dimensions.height, {
        fit: type === 'logo' ? 'contain' : 'cover',
        background: type === 'logo' ? { r: 255, g: 255, b: 255, alpha: 0 } : undefined,
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Upload to R2
    await s3.send(new PutObjectCommand({
      Bucket: config.storage.r2BucketName,
      Key: key,
      Body: processedBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000',
      Metadata: {
        userId,
        type,
        originalName: file.originalname,
      },
    }));

    const publicUrl = config.storage.r2PublicUrl
      ? `${config.storage.r2PublicUrl}/${key}`
      : `https://media.truvis.info/${key}`;

    logger.info('[Storage] Uploaded', { key, type, userId, size: processedBuffer.length });
    return publicUrl;
  },

  async deleteFile(url: string): Promise<void> {
    if (!config.storage.r2PublicUrl || !url.startsWith(config.storage.r2PublicUrl)) {
      return;
    }

    const key = url.replace(`${config.storage.r2PublicUrl}/`, '');
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: config.storage.r2BucketName,
        Key: key,
      }));
      logger.info('[Storage] Deleted', { key });
    } catch (err) {
      logger.error('[Storage] Delete failed', { err, key });
    }
  },
};
