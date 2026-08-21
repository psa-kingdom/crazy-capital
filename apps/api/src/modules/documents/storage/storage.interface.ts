export interface PresignedUrlResult {
  url: string;
  storageKey: string;
  expiresInSeconds: number;
}

export interface ObjectStorageProvider {
  /**
   * Generates a signed PUT URL for direct client-to-storage upload
   */
  getPresignedUploadUrl(
    storageKey: string,
    mimeType: string,
    expiresInSeconds?: number,
  ): Promise<PresignedUrlResult>;

  /**
   * Generates a short-lived signed GET URL for secure document viewing/download
   */
  getPresignedDownloadUrl(
    storageKey: string,
    expiresInSeconds?: number,
  ): Promise<string>;

  /**
   * Deletes an object from storage
   */
  deleteObject(storageKey: string): Promise<void>;
}
