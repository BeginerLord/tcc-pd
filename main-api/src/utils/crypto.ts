import crypto from "crypto";

// Ensure the key is exactly 32 bytes (256 bits) for AES-256
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is required. Please set it in your .env file (must be 32 characters)."
    );
  }

  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly 32 characters. Current length: ${key.length}`
    );
  }

  return Buffer.from(key, "utf8");
};

const ENCRYPTION_KEY = getEncryptionKey();
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // AES block size

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(text: string): string {
  // Check if this looks like bcrypt hash (starts with $2b$, $2a$, etc.)
  if (text.startsWith("$2")) {
    throw new Error("Cannot decrypt bcrypt hash - user needs to re-register");
  }

  try {
    const textParts = text.split(":");
    if (textParts.length !== 2) {
      throw new Error("Invalid encrypted text format");
    }
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = textParts.join(":");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    throw new Error(
      `Decryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
