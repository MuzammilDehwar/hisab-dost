const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface EncryptedPayload {
  version: 1;
  algorithm: 'AES-GCM';
  kdf: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

const ITERATIONS = 250_000;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptJson(value: unknown, passphrase: string): Promise<EncryptedPayload> {
  if (passphrase.trim().length < 12) throw new Error('Encryption passphrase must be at least 12 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(value)));
  return {
    version: 1,
    algorithm: 'AES-GCM',
    kdf: 'PBKDF2-SHA-256',
    iterations: ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptJson<T>(payload: EncryptedPayload, passphrase: string): Promise<T> {
  if (!payload || payload.version !== 1 || payload.algorithm !== 'AES-GCM') {
    throw new Error('Unsupported encrypted data format.');
  }
  try {
    const key = await deriveKey(passphrase, fromBase64(payload.salt));
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(payload.iv) as BufferSource }, key, fromBase64(payload.ciphertext) as BufferSource);
    return JSON.parse(decoder.decode(plaintext)) as T;
  } catch {
    const error = new Error('Invalid encryption passphrase or damaged encrypted data.') as Error & { code?: string };
    error.code = 'data/passphrase';
    throw error;
  }
}

export function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  return Boolean(value && typeof value === 'object' && (value as EncryptedPayload).version === 1 && (value as EncryptedPayload).ciphertext);
}
