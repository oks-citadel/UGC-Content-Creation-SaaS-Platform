import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

const secret = new TextEncoder().encode(config.jwt.secret);

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  sessionId: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

export async function generateAccessToken(payload: Omit<TokenPayload, 'type'>): Promise<{ token: string; expiresAt: Date }> {
  const expiresIn = parseExpiry(config.jwt.accessTokenExpiry);
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const token = await new jose.SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(config.jwt.issuer)
    .setAudience(config.jwt.audience)
    .setExpirationTime(expiresAt)
    .setJti(uuidv4())
    .sign(secret);

  return { token, expiresAt };
}

export async function generateRefreshToken(payload: Omit<TokenPayload, 'type'>): Promise<{ token: string; expiresAt: Date }> {
  const expiresIn = parseExpiry(config.jwt.refreshTokenExpiry);
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const token = await new jose.SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(config.jwt.issuer)
    .setAudience(config.jwt.audience)
    .setExpirationTime(expiresAt)
    .setJti(uuidv4())
    .sign(secret);

  return { token, expiresAt };
}

export async function generateTokenPair(payload: Omit<TokenPayload, 'type'>): Promise<TokenPair> {
  const [accessResult, refreshResult] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return {
    accessToken: accessResult.token,
    refreshToken: refreshResult.token,
    accessTokenExpiresAt: accessResult.expiresAt,
    refreshTokenExpiresAt: refreshResult.expiresAt,
  };
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jose.jwtVerify(token, secret, {
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });

  return payload as unknown as TokenPayload;
}

export async function decodeToken(token: string): Promise<TokenPayload | null> {
  try {
    const decoded = jose.decodeJwt(token);
    return decoded as unknown as TokenPayload;
  } catch {
    return null;
  }
}
