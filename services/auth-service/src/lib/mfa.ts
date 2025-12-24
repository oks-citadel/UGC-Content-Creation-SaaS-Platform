import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { config } from '../config';

// Configure authenticator options
authenticator.options = {
  window: config.mfa.tokenWindow,
  step: 30, // 30 second time step
};

// Constants for security
const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LENGTH = 8;
const EMAIL_OTP_LENGTH = 6;
const EMAIL_OTP_EXPIRY_MINUTES = 10;
const SALT_ROUNDS = 10;

/**
 * Generate a cryptographically secure TOTP secret
 */
export function generateSecret(): string {
  return authenticator.generateSecret(32);
}

/**
 * Generate OTP Auth URL for TOTP apps
 */
export function generateOtpAuthUrl(email: string, secret: string): string {
  return authenticator.keyuri(email, config.mfa.issuer, secret);
}

/**
 * Generate QR Code as Data URL
 */
export async function generateQRCode(otpAuthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 256,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Verify a TOTP token against a secret
 */
export function verifyToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/**
 * Generate a TOTP token for testing/backup purposes
 */
export function generateToken(secret: string): string {
  return authenticator.generate(secret);
}

/**
 * Generate a cryptographically secure email OTP code
 */
export function generateEmailOtp(): string {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(EMAIL_OTP_LENGTH);

  for (let i = 0; i < EMAIL_OTP_LENGTH; i++) {
    otp += digits[randomBytes[i] % 10];
  }

  return otp;
}

/**
 * Generate recovery codes with high entropy
 */
export function generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
  const codes: string[] = [];
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters

  for (let i = 0; i < count; i++) {
    let code = '';
    const randomBytes = crypto.randomBytes(RECOVERY_CODE_LENGTH);

    for (let j = 0; j < RECOVERY_CODE_LENGTH; j++) {
      code += characters[randomBytes[j] % characters.length];
    }

    // Format as XXXX-XXXX for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}

/**
 * Hash a recovery code for secure storage
 */
export async function hashRecoveryCode(code: string): Promise<string> {
  // Normalize the code (remove dashes, uppercase)
  const normalizedCode = code.replace(/-/g, '').toUpperCase();
  return bcrypt.hash(normalizedCode, SALT_ROUNDS);
}

/**
 * Verify a recovery code against its hash
 */
export async function verifyRecoveryCode(code: string, hash: string): Promise<boolean> {
  const normalizedCode = code.replace(/-/g, '').toUpperCase();
  return bcrypt.compare(normalizedCode, hash);
}

/**
 * Encrypt a TOTP secret for storage
 */
export function encryptSecret(secret: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(config.jwt.secret, 'mfa-salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Combine iv, authTag, and encrypted data
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a TOTP secret from storage
 */
export function decryptSecret(encryptedData: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(config.jwt.secret, 'mfa-salt', 32);

  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * MFA Setup Data interface
 */
export interface MfaSetupData {
  secret: string;
  encryptedSecret: string;
  otpAuthUrl: string;
  qrCode: string;
}

/**
 * Setup MFA for a user - generates all required data
 */
export async function setupMfa(email: string): Promise<MfaSetupData> {
  const secret = generateSecret();
  const otpAuthUrl = generateOtpAuthUrl(email, secret);
  const qrCode = await generateQRCode(otpAuthUrl);
  const encryptedSecret = encryptSecret(secret);

  return {
    secret,
    encryptedSecret,
    otpAuthUrl,
    qrCode,
  };
}

/**
 * Setup recovery codes for a user
 */
export interface RecoveryCodeSetup {
  plainCodes: string[];
  hashedCodes: string[];
}

export async function setupRecoveryCodes(): Promise<RecoveryCodeSetup> {
  const plainCodes = generateRecoveryCodes();
  const hashedCodes = await Promise.all(
    plainCodes.map(code => hashRecoveryCode(code))
  );

  return {
    plainCodes,
    hashedCodes,
  };
}

/**
 * Calculate time remaining before OTP expires (for UI countdown)
 */
export function getTimeRemaining(): number {
  const epoch = Math.floor(Date.now() / 1000);
  const step = 30;
  return step - (epoch % step);
}

/**
 * Check if an IP is rate limited for MFA attempts
 */
export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  lockoutMinutes?: number;
}

export function calculateRateLimit(
  failedAttempts: number,
  lastAttemptTime: Date | null,
  maxAttempts: number = 5,
  lockoutDurationMinutes: number = 15
): RateLimitResult {
  // If no attempts or last attempt was long ago, allow
  if (!lastAttemptTime || failedAttempts === 0) {
    return { allowed: true, remainingAttempts: maxAttempts };
  }

  const timeSinceLastAttempt = Date.now() - lastAttemptTime.getTime();
  const lockoutDurationMs = lockoutDurationMinutes * 60 * 1000;

  // If within lockout period and max attempts reached
  if (failedAttempts >= maxAttempts && timeSinceLastAttempt < lockoutDurationMs) {
    const remainingLockout = Math.ceil((lockoutDurationMs - timeSinceLastAttempt) / 60000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutMinutes: remainingLockout,
    };
  }

  // If lockout period has passed, reset
  if (timeSinceLastAttempt >= lockoutDurationMs) {
    return { allowed: true, remainingAttempts: maxAttempts };
  }

  return {
    allowed: true,
    remainingAttempts: maxAttempts - failedAttempts,
  };
}

/**
 * Validate MFA token format
 */
export function validateTokenFormat(token: string, type: 'totp' | 'email' | 'recovery'): boolean {
  switch (type) {
    case 'totp':
    case 'email':
      // 6 digits
      return /^\d{6}$/.test(token);
    case 'recovery':
      // 8 alphanumeric with optional dash in middle
      return /^[A-Z0-9]{4}-?[A-Z0-9]{4}$/i.test(token);
    default:
      return false;
  }
}

/**
 * Email OTP expiry calculation
 */
export function getEmailOtpExpiry(): Date {
  return new Date(Date.now() + EMAIL_OTP_EXPIRY_MINUTES * 60 * 1000);
}

/**
 * Check if email OTP is expired
 */
export function isEmailOtpExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
