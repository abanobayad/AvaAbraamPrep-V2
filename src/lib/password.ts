export const PBKDF2_ITERATIONS = 1000;
export const MAX_VERIFY_ITERATIONS = 5000;
const HASH_BYTES = 32;
const SALT_BYTES = 16;
const ALG = "PBKDF2";
const DIGEST = "SHA-256";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function hashPassword(password: string, customIters?: number): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iters = customIters || PBKDF2_ITERATIONS;
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: ALG },
    false,
    ["deriveBits"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: ALG,
      salt: salt,
      iterations: iters,
      hash: DIGEST,
    },
    keyMaterial,
    HASH_BYTES * 8
  );

  const saltB64 = arrayBufferToBase64(salt.buffer as ArrayBuffer);
  const hashB64 = arrayBufferToBase64(hashBuffer);

  return `pbkdf2$${iters}$${saltB64}$${hashB64}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith("pbkdf2$")) {
    return false;
  }

  const parts = stored.split("$");
  if (parts.length !== 4) return false;
  
  const iterations = parseInt(parts[1], 10);
  if (iterations > MAX_VERIFY_ITERATIONS) {
    throw new Error("RESET_REQUIRED");
  }
  
  const saltB64 = parts[2];
  const storedHashB64 = parts[3];

  const saltBuffer = base64ToArrayBuffer(saltB64);
  const storedHashBuffer = base64ToArrayBuffer(storedHashB64);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: ALG },
    false,
    ["deriveBits"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: ALG,
      salt: saltBuffer,
      iterations: iterations,
      hash: DIGEST,
    },
    keyMaterial,
    HASH_BYTES * 8
  );

  const a = new Uint8Array(hashBuffer);
  const b = new Uint8Array(storedHashBuffer);
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}
