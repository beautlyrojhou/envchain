import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export function deriveKey(secret: string): Buffer {
  return crypto.scryptSync(secret, "envchain-salt", KEY_LENGTH);
}

export function encryptValue(value: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptValue(encoded: string, secret: string): string {
  const key = deriveKey(secret);
  const data = Buffer.from(encoded, "base64");
  if (data.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Invalid encrypted value: too short");
  }
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

export function encryptEnvMap(
  envMap: Record<string, string>,
  secret: string,
  keys?: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(envMap)) {
    if (!keys || keys.includes(k)) {
      result[k] = `enc:${encryptValue(v, secret)}`;
    } else {
      result[k] = v;
    }
  }
  return result;
}

export function decryptEnvMap(
  envMap: Record<string, string>,
  secret: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(envMap)) {
    if (v.startsWith("enc:")) {
      result[k] = decryptValue(v.slice(4), secret);
    } else {
      result[k] = v;
    }
  }
  return result;
}
