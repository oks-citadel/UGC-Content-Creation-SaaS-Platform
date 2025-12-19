import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { config } from '../config';

authenticator.options = {
  window: config.mfa.tokenWindow,
};

export function generateSecret(): string {
  return authenticator.generateSecret();
}

export function generateOtpAuthUrl(email: string, secret: string): string {
  return authenticator.keyuri(email, config.mfa.issuer, secret);
}

export async function generateQRCode(otpAuthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUrl);
}

export function verifyToken(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

export function generateToken(secret: string): string {
  return authenticator.generate(secret);
}

export interface MfaSetupData {
  secret: string;
  otpAuthUrl: string;
  qrCode: string;
}

export async function setupMfa(email: string): Promise<MfaSetupData> {
  const secret = generateSecret();
  const otpAuthUrl = generateOtpAuthUrl(email, secret);
  const qrCode = await generateQRCode(otpAuthUrl);

  return {
    secret,
    otpAuthUrl,
    qrCode,
  };
}
