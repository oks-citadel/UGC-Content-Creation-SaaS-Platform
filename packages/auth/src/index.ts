// Auth package - authentication utilities
export { hash, compare } from 'bcryptjs';
export * from 'jose';
import { jwtVerify, SignJWT } from 'jose';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: Date;
}

/**
 * Verify a JWT token
 */
export async function verifyJWT(token: string, secret: string) {
  const secretKey = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, secretKey);
  return payload;
}

/**
 * Sign a JWT token
 */
export async function signJWT(payload: Record<string, unknown>, secret: string, expiresIn = '1h') {
  const secretKey = new TextEncoder().encode(secret);
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(secretKey);
  return token;
}
