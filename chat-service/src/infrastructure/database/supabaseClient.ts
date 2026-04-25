// src/infrastructure/database/supabaseClient.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../../shared/logger';

let instance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (instance !== null) {
    return instance;
  }

  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!url || url.trim() === '') {
    throw new Error('Missing environment variable: SUPABASE_URL');
  }

  if (!key || key.trim() === '') {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
  }

  instance = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  logger.info('Supabase client initialized');
  return instance;
}
