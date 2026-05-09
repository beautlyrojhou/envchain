import {
  deriveKey,
  encryptValue,
  decryptValue,
  encryptEnvMap,
  decryptEnvMap,
} from "./encryptor";

const SECRET = "test-secret-passphrase";

describe("deriveKey", () => {
  it("returns a 32-byte buffer", () => {
    const key = deriveKey(SECRET);
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it("is deterministic for the same secret", () => {
    expect(deriveKey(SECRET).toString("hex")).toBe(
      deriveKey(SECRET).toString("hex")
    );
  });
});

describe("encryptValue / decryptValue", () => {
  it("round-trips a plain string", () => {
    const original = "super-secret-value";
    const encrypted = encryptValue(original, SECRET);
    expect(encrypted).not.toBe(original);
    expect(decryptValue(encrypted, SECRET)).toBe(original);
  });

  it("produces different ciphertext each call (random IV)", () => {
    const a = encryptValue("hello", SECRET);
    const b = encryptValue("hello", SECRET);
    expect(a).not.toBe(b);
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encryptValue("value", SECRET);
    const tampered = encrypted.slice(0, -4) + "AAAA";
    expect(() => decryptValue(tampered, SECRET)).toThrow();
  });

  it("throws on too-short input", () => {
    expect(() => decryptValue("c2hvcnQ=", SECRET)).toThrow(
      "Invalid encrypted value: too short"
    );
  });
});

describe("encryptEnvMap", () => {
  const env = { API_KEY: "abc123", PORT: "3000", DB_PASS: "secret" };

  it("encrypts all keys when no filter provided", () => {
    const result = encryptEnvMap(env, SECRET);
    for (const v of Object.values(result)) {
      expect(v.startsWith("enc:")).toBe(true);
    }
  });

  it("only encrypts specified keys", () => {
    const result = encryptEnvMap(env, SECRET, ["API_KEY", "DB_PASS"]);
    expect(result["API_KEY"].startsWith("enc:")).toBe(true);
    expect(result["DB_PASS"].startsWith("enc:")).toBe(true);
    expect(result["PORT"]).toBe("3000");
  });
});

describe("decryptEnvMap", () => {
  it("decrypts only enc:-prefixed values", () => {
    const env = { API_KEY: "abc123", PORT: "3000" };
    const encrypted = encryptEnvMap(env, SECRET, ["API_KEY"]);
    const decrypted = decryptEnvMap(encrypted, SECRET);
    expect(decrypted["API_KEY"]).toBe("abc123");
    expect(decrypted["PORT"]).toBe("3000");
  });

  it("round-trips a fully encrypted map", () => {
    const env = { X: "foo", Y: "bar" };
    const encrypted = encryptEnvMap(env, SECRET);
    const decrypted = decryptEnvMap(encrypted, SECRET);
    expect(decrypted).toEqual(env);
  });
});
