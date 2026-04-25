// src/infrastructure/database/repositories/StorageRepository.ts

import { SupabaseClient } from '@supabase/supabase-js';
import { IStorageRepository } from '../../../domain/repositories/IStorageRepository';
import { logger } from '../../../shared/logger';

export class StorageRepository implements IStorageRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async createSignedUrl(
    bucket: string,
    storagePath: string,
    expiresInSeconds: number
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      logger.error('Error creating signed URL', {
        bucket,
        storagePath,
        error: error?.message,
      });
      throw new Error(`Storage error: ${error?.message ?? 'No URL returned'}`);
    }

    return data.signedUrl;
  }
}
