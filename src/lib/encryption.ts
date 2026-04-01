import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) throw new Error('ENCRYPTION_KEY not set in environment');
    // Accept hex (64 chars) or raw string (hashed to 32 bytes)
    if (key.length === 64 && /^[0-9a-f]+$/i.test(key)) {
        return Buffer.from(key, 'hex');
    }
    return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a string using AES-256-GCM.
 * Returns: iv:tag:ciphertext (all hex-encoded)
 */
export function encrypt(text: string): string {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with encrypt().
 * Expects format: iv:tag:ciphertext (all hex-encoded)
 */
export function decrypt(encryptedText: string): string {
    const key = getKey();
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Check if a string is already encrypted (has iv:tag:cipher format).
 */
export function isEncrypted(text: string): boolean {
    const parts = text.split(':');
    return parts.length === 3 && parts[0].length === 32 && parts[1].length === 32;
}
