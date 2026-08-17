import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

/**
 * Cloud is optional. With no .env the app runs exactly as before — purely
 * local — so a missing backend can never break the core product.
 */
export const cloudEnabled = Boolean(url && key);

export const supabase = cloudEnabled
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // magic-link callbacks land back here
      },
    })
  : null;

export type SyncStatus = 'offline' | 'signed-out' | 'syncing' | 'synced' | 'error';
