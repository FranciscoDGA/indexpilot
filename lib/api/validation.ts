import { z } from 'zod';

// Validation schemas for API

export const publishRequestSchema = z.object({
  url: z.string()
    .url('URL must be valid')
    .min(10, 'URL must be at least 10 characters')
    .max(2000, 'URL must not exceed 2000 characters'),
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must not exceed 255 characters'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(255, 'Slug must not exceed 255 characters')
    .regex(/^[a-z0-9\-]+$/i, 'Slug must contain only letters, numbers, and hyphens'),
  type: z.enum(['article', 'page', 'product', 'other']).default('article'),
});

export type PublishRequest = z.infer<typeof publishRequestSchema>;

// Validation functions

export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isLocalhost(domain: string): boolean {
  return domain === 'localhost' ||
         domain === '127.0.0.1' ||
         domain.startsWith('localhost:') ||
         domain.startsWith('127.0.0.1:');
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

export function validatePublishRequest(data: unknown): { valid: boolean; data?: PublishRequest; error?: string } {
  try {
    const parsed = publishRequestSchema.parse(data);

    // Additional custom validations
    if (!isValidUrl(parsed.url)) {
      return { valid: false, error: 'URL must be HTTPS' };
    }

    const domain = extractDomain(parsed.url);
    if (isLocalhost(domain)) {
      return { valid: false, error: 'Localhost URLs are not allowed' };
    }

    return { valid: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message || 'Validation failed' };
    }
    return { valid: false, error: 'Validation failed' };
  }
}
