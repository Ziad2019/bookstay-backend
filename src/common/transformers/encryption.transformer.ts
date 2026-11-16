// Path: src/common/transformers/encryption.transformer.ts
import { ValueTransformer } from 'typeorm';
import * as crypto from 'crypto';

/**
 * Automatically encrypts sensitive fields (National ID, Bank Account, IBAN)
 * using AES-256-GCM before saving to PostgreSQL and decrypts them when read.
 * Requires process.env.ENCRYPTION_KEY (64-char hex string = 32 bytes).
 */
export class EncryptionTransformer implements ValueTransformer {
  private readonly algorithm = 'aes-256-gcm';

  private getKey(): Buffer {
    const rawKey =
      process.env.ENCRYPTION_KEY ||
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    return Buffer.from(rawKey, 'hex');
  }

  to(plainText?: string | null): string | null {
    if (!plainText) return null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.getKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  from(cipherText?: string | null): string | null {
    if (!cipherText) return null;
    const parts = cipherText.split(':');
    if (parts.length !== 3) return cipherText;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.getKey(),
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
}