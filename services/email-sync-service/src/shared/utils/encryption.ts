import crypto from "crypto";
import { config } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

export function encrypt(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  if (!config.encryptionKey) {
    throw new Error("ENCRYPTION_KEY is required for encryption");
  }
  const key = crypto.scryptSync(config.encryptionKey, salt, 32);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  const tag = cipher.getAuthTag();
  
  // Combine salt + iv + tag + encrypted text and convert to base64
  const result = Buffer.concat([
    salt,
    iv,
    tag,
    Buffer.from(encrypted, "base64")
  ]).toString("base64");
  
  return result;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  try {
    const data = Buffer.from(encryptedText, "base64");
    
    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, TAG_POSITION);
    const tag = data.subarray(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = data.subarray(ENCRYPTED_POSITION);
    
    if (!config.encryptionKey) {
      throw new Error("ENCRYPTION_KEY is required for decryption");
    }
    const key = crypto.scryptSync(config.encryptionKey, salt, 32);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (err) {
    return ""; // Or throw
  }
}
