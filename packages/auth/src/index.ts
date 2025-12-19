// Auth package - authentication utilities
export { hash, compare } from 'bcryptjs';
export * from 'jose';

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
