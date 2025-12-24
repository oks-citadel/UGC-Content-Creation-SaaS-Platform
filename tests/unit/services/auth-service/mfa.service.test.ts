/**
 * MFA Service Unit Tests
 * Tests the Multi-Factor Authentication functionality
 */

import {
  generateSecret,
  generateOtpAuthUrl,
  verifyToken,
  generateEmailOtp,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
  encryptSecret,
  decryptSecret,
  validateTokenFormat,
  calculateRateLimit,
} from '../../../../services/auth-service/src/lib/mfa';

describe('MFA Library', () => {
  describe('generateSecret', () => {
    it('should generate a base32 encoded secret', () => {
      const secret = generateSecret();
      expect(secret).toBeDefined();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBeGreaterThan(16);
      // Base32 characters
      expect(secret).toMatch(/^[A-Z2-7]+$/);
    });

    it('should generate unique secrets', () => {
      const secret1 = generateSecret();
      const secret2 = generateSecret();
      expect(secret1).not.toEqual(secret2);
    });
  });

  describe('generateOtpAuthUrl', () => {
    it('should generate a valid otpauth URL', () => {
      const secret = 'TESTSECRET123456';
      const email = 'test@example.com';
      const url = generateOtpAuthUrl(email, secret);

      expect(url).toContain('otpauth://totp/');
      expect(url).toContain(encodeURIComponent(email));
      expect(url).toContain('secret=' + secret);
    });
  });

  describe('verifyToken', () => {
    it('should return false for invalid token format', () => {
      const secret = generateSecret();
      expect(verifyToken('invalid', secret)).toBe(false);
      expect(verifyToken('12345', secret)).toBe(false);
      expect(verifyToken('1234567', secret)).toBe(false);
    });

    it('should return false for wrong token', () => {
      const secret = generateSecret();
      expect(verifyToken('000000', secret)).toBe(false);
    });
  });

  describe('generateEmailOtp', () => {
    it('should generate a 6-digit numeric OTP', () => {
      const otp = generateEmailOtp();
      expect(otp).toBeDefined();
      expect(otp.length).toBe(6);
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate unique OTPs', () => {
      const otps = new Set();
      for (let i = 0; i < 100; i++) {
        otps.add(generateEmailOtp());
      }
      // Should have high uniqueness (at least 90% unique in 100 attempts)
      expect(otps.size).toBeGreaterThan(90);
    });
  });

  describe('generateRecoveryCodes', () => {
    it('should generate the specified number of codes', () => {
      const codes = generateRecoveryCodes(10);
      expect(codes.length).toBe(10);
    });

    it('should generate codes in XXXX-XXXX format', () => {
      const codes = generateRecoveryCodes(5);
      codes.forEach((code) => {
        expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      });
    });

    it('should generate unique codes', () => {
      const codes = generateRecoveryCodes(10);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(10);
    });
  });

  describe('hashRecoveryCode / verifyRecoveryCode', () => {
    it('should hash and verify a recovery code', async () => {
      const code = 'ABCD-1234';
      const hash = await hashRecoveryCode(code);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(code);

      const isValid = await verifyRecoveryCode(code, hash);
      expect(isValid).toBe(true);
    });

    it('should verify codes case-insensitively', async () => {
      const code = 'ABCD-1234';
      const hash = await hashRecoveryCode(code);

      const isValid = await verifyRecoveryCode('abcd-1234', hash);
      expect(isValid).toBe(true);
    });

    it('should verify codes without dashes', async () => {
      const code = 'ABCD-1234';
      const hash = await hashRecoveryCode(code);

      const isValid = await verifyRecoveryCode('ABCD1234', hash);
      expect(isValid).toBe(true);
    });

    it('should reject wrong codes', async () => {
      const code = 'ABCD-1234';
      const hash = await hashRecoveryCode(code);

      const isValid = await verifyRecoveryCode('WXYZ-9876', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('encryptSecret / decryptSecret', () => {
    it('should encrypt and decrypt a secret', () => {
      const original = 'TESTSECRET123456TESTSECRET123456';
      const encrypted = encryptSecret(original);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(original);
      expect(encrypted).toContain(':');

      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should produce different ciphertexts for same plaintext (due to random IV)', () => {
      const secret = 'TESTSECRET123456';
      const encrypted1 = encryptSecret(secret);
      const encrypted2 = encryptSecret(secret);

      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same value
      expect(decryptSecret(encrypted1)).toBe(secret);
      expect(decryptSecret(encrypted2)).toBe(secret);
    });
  });

  describe('validateTokenFormat', () => {
    describe('TOTP tokens', () => {
      it('should validate 6-digit numeric tokens', () => {
        expect(validateTokenFormat('123456', 'totp')).toBe(true);
        expect(validateTokenFormat('000000', 'totp')).toBe(true);
        expect(validateTokenFormat('999999', 'totp')).toBe(true);
      });

      it('should reject invalid TOTP tokens', () => {
        expect(validateTokenFormat('12345', 'totp')).toBe(false);
        expect(validateTokenFormat('1234567', 'totp')).toBe(false);
        expect(validateTokenFormat('abcdef', 'totp')).toBe(false);
        expect(validateTokenFormat('', 'totp')).toBe(false);
      });
    });

    describe('Email OTP tokens', () => {
      it('should validate 6-digit numeric tokens', () => {
        expect(validateTokenFormat('123456', 'email')).toBe(true);
      });

      it('should reject invalid email OTP tokens', () => {
        expect(validateTokenFormat('12345', 'email')).toBe(false);
        expect(validateTokenFormat('abcdef', 'email')).toBe(false);
      });
    });

    describe('Recovery codes', () => {
      it('should validate 8-character alphanumeric codes', () => {
        expect(validateTokenFormat('ABCD-1234', 'recovery')).toBe(true);
        expect(validateTokenFormat('ABCD1234', 'recovery')).toBe(true);
        expect(validateTokenFormat('abcd-1234', 'recovery')).toBe(true);
      });

      it('should reject invalid recovery codes', () => {
        expect(validateTokenFormat('ABC-123', 'recovery')).toBe(false);
        expect(validateTokenFormat('ABCDE-12345', 'recovery')).toBe(false);
        expect(validateTokenFormat('', 'recovery')).toBe(false);
      });
    });
  });

  describe('calculateRateLimit', () => {
    it('should allow when no previous attempts', () => {
      const result = calculateRateLimit(0, null);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });

    it('should allow when under max attempts', () => {
      const result = calculateRateLimit(3, new Date());
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(2);
    });

    it('should block when max attempts reached within lockout period', () => {
      const result = calculateRateLimit(5, new Date());
      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.lockoutMinutes).toBeGreaterThan(0);
    });

    it('should allow after lockout period expires', () => {
      const oldTime = new Date(Date.now() - 16 * 60 * 1000); // 16 minutes ago
      const result = calculateRateLimit(5, oldTime);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });
  });
});

describe('MFA Security', () => {
  it('should not include similar-looking characters in recovery codes', () => {
    const codes = generateRecoveryCodes(100);
    const allCodes = codes.join('');

    // Should not contain 0, 1, I, L, O (similar looking characters)
    expect(allCodes).not.toMatch(/[01ILO]/);
  });

  it('should generate recovery codes with sufficient entropy', () => {
    const codes = generateRecoveryCodes(10);

    // Each code is 8 characters from a 32-character alphabet
    // Entropy = 8 * log2(32) = 8 * 5 = 40 bits per code
    // This is sufficient for one-time backup codes
    codes.forEach((code) => {
      const normalized = code.replace('-', '');
      expect(normalized.length).toBe(8);
    });
  });

  it('should use authenticated encryption for secrets', () => {
    const secret = 'TESTSECRET';
    const encrypted = encryptSecret(secret);

    // Should have IV:AuthTag:Ciphertext format
    const parts = encrypted.split(':');
    expect(parts.length).toBe(3);

    // IV should be 32 hex characters (16 bytes)
    expect(parts[0].length).toBe(32);

    // Auth tag should be 32 hex characters (16 bytes)
    expect(parts[1].length).toBe(32);
  });
});
