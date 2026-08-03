import crypto from 'crypto';
import { createClient } from './supabaseServer';

// Generate API Key
export function generateApiKey(type: 'live' | 'test'): string {
  const prefix = type === 'live' ? 'pk_live_' : 'pk_test_';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return prefix + randomBytes;
}

// Hash API Key
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Verify API Key
export async function verifyApiKey(
  key: string,
  domain: string
): Promise<{
  valid: boolean;
  siteId?: string;
  error?: string;
}> {
  try {
    const hashedKey = hashApiKey(key);
    const supabase = createClient();

    // Find API key
    const { data: apiKey, error: keyError } = await supabase
      .from('api_keys')
      .select('*, sites(domain)')
      .eq('key_hash', hashedKey)
      .eq('active', true)
      .single();

    if (keyError || !apiKey) {
      return { valid: false, error: 'Invalid API Key' };
    }

    // Verify domain matches
    const siteDomain = apiKey.sites?.domain || '';
    if (siteDomain !== domain) {
      return { valid: false, error: 'Unauthorized domain' };
    }

    return { valid: true, siteId: apiKey.site_id };
  } catch (error) {
    console.error('API Key verification error:', error);
    return { valid: false, error: 'API Key verification failed' };
  }
}

// Update API Key last used
export async function updateApiKeyLastUsed(
  keyHash: string,
  ip: string
): Promise<void> {
  try {
    const supabase = createClient();

    await supabase
      .from('api_keys')
      .update({
        last_used_at: new Date().toISOString(),
        last_used_ip: ip,
      })
      .eq('key_hash', keyHash);
  } catch (error) {
    console.error('Error updating API key last used:', error);
  }
}

// Extract API Key from Authorization header
export function extractApiKey(authHeader: string | null): { key?: string; error?: string } {
  if (!authHeader) {
    return { error: 'Missing Authorization header' };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { error: 'Invalid Authorization header format' };
  }

  const key = authHeader.substring(7);
  if (!key) {
    return { error: 'Missing API Key' };
  }

  return { key };
}
