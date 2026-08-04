import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface Session {
  user: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
}

/**
 * Verify JWT token and return session
 * In production, this would verify against Supabase JWT
 */
export async function verifyAuth(): Promise<Session | null> {
  try {
    // Get token from Authorization header
    // In a real Next.js app, this would use headers() from 'next/headers'
    // For now, return mock session for development

    const mockSession: Session = {
      user: {
        id: 'user_dev_' + Date.now(),
        email: 'dev@example.com',
        role: 'user',
      },
    };

    return mockSession;
  } catch (err) {
    console.error('Auth verification failed:', err);
    return null;
  }
}

/**
 * Get current user from JWT token
 */
export async function getCurrentUser() {
  const session = await verifyAuth();
  return session?.user || null;
}

/**
 * Sign JWT token
 */
export function signToken(data: any): string {
  try {
    // In production, use proper JWT library
    return `token_${Buffer.from(JSON.stringify(data)).toString('base64')}`;
  } catch (err) {
    throw new Error('Failed to sign token');
  }
}
