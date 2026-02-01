import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// DigitalOcean Spaces configuration
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'https://sgp1.digitaloceanspaces.com',
  region: process.env.S3_REGION || 'sgp1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: false,
});

const BUCKET_NAME = process.env.S3_BUCKET || 'peoplehub';
const CDN_URL = process.env.S3_CDN_URL || 'https://peoplehub.sgp1.digitaloceanspaces.com';

export type UploadFolder = 'templates' | 'documents' | 'avatars' | 'attachments';

interface UploadResult {
  key: string;
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

class UploadService {
  /**
   * Upload file to S3/Spaces
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: UploadFolder
  ): Promise<UploadResult> {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const key = `${folder}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    return {
      key,
      url: `${CDN_URL}/${key}`,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder: UploadFolder
  ): Promise<UploadResult[]> {
    const results = await Promise.all(
      files.map((file) => this.uploadFile(file, folder))
    );
    return results;
  }

  /**
   * Delete file from S3/Spaces
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  }

  /**
   * Get presigned URL for direct upload
   */
  async getPresignedUrl(
    folder: UploadFolder,
    filename: string,
    contentType: string
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const ext = path.extname(filename);
    const key = `${folder}/${uuidv4()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return {
      uploadUrl,
      key,
      publicUrl: `${CDN_URL}/${key}`,
    };
  }

  /**
   * Extract key from full URL
   */
  extractKeyFromUrl(url: string): string | null {
    if (!url) return null;

    try {
      const urlObj = new URL(url);
      return urlObj.pathname.slice(1); // Remove leading slash
    } catch {
      return null;
    }
  }
}

export const uploadService = new UploadService();
