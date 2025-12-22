import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const key = process.env.GARMIN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("GARMIN_ENCRYPTION_KEY environment variable is required");
  }

  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `GARMIN_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (64 hex characters)`
    );
  }

  return keyBuffer;
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, "utf8", "base64");
  ciphertext += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${ciphertext}:${authTag.toString("base64")}`;
}

export function decrypt(encryptedString: string): string {
  const key = getEncryptionKey();

  const parts = encryptedString.split(":");
  // biome-ignore lint/style/noMagicNumbers: part length is 3
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted string format");
  }

  const [ivB64, ciphertext, authTagB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(ciphertext, "base64", "utf8");
  plaintext += decipher.final("utf8");

  return plaintext;
}

export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString("hex");
}
