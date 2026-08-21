import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ObjectStorageProvider, PresignedUrlResult } from './storage.interface';

@Injectable()
export class R2StorageService implements ObjectStorageProvider {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME', 'crazy-capital-vault');

    if (accountId && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.isConfigured = true;
      this.logger.log('✅ Cloudflare R2 Storage Provider initialized successfully');
    } else {
      this.isConfigured = false;
      this.logger.warn('⚠️ Cloudflare R2 credentials not provided — using Development Mock Storage Provider');
    }
  }

  async getPresignedUploadUrl(
    storageKey: string,
    mimeType: string,
    expiresInSeconds = 900, // 15 mins default
  ): Promise<PresignedUrlResult> {
    if (this.isConfigured && this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
        ContentType: mimeType,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
      return {
        url,
        storageKey,
        expiresInSeconds,
      };
    }

    // Mock signed URL for local/test execution
    const mockUrl = `https://vault-mock.crazycapital.in/upload?key=${encodeURIComponent(
      storageKey,
    )}&mime=${encodeURIComponent(mimeType)}&exp=${Date.now() + expiresInSeconds * 1000}`;

    return {
      url: mockUrl,
      storageKey,
      expiresInSeconds,
    };
  }

  async getPresignedDownloadUrl(
    storageKey: string,
    expiresInSeconds = 900, // 15 mins default
  ): Promise<string> {
    if (this.isConfigured && this.s3Client) {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });

      return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
    }

    // Mock signed URL for local/test execution
    return `https://vault-mock.crazycapital.in/download?key=${encodeURIComponent(
      storageKey,
    )}&exp=${Date.now() + expiresInSeconds * 1000}`;
  }

  async deleteObject(storageKey: string): Promise<void> {
    if (this.isConfigured && this.s3Client) {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });
      await this.s3Client.send(command);
    } else {
      this.logger.log(`[MockStorage] Deleted object with key: ${storageKey}`);
    }
  }
}
