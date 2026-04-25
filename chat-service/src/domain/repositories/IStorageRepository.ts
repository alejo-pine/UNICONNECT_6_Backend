// src/domain/repositories/IStorageRepository.ts

export interface IStorageRepository {
  /**
   * Generates a signed URL for a file in Supabase Storage.
   * @param bucket - The storage bucket name
   * @param storagePath - The path to the file within the bucket
   * @param expiresInSeconds - URL expiration in seconds (default 3600)
   */
  createSignedUrl(
    bucket: string,
    storagePath: string,
    expiresInSeconds: number
  ): Promise<string>;
}
