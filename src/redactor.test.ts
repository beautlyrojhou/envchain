import { describe, it, expect } from "vitest";
import {
  isSensitiveKey,
  maskValue,
  redactEnvMap,
  DEFAULT_SENSITIVE_PATTERNS,
} from "./redactor";

describe("isSensitiveKey", () => {
  it("detects common sensitive key names", () => {
    expect(isSensitiveKey("DB_PASSWORD")).toBe(true);
    expect(isSensitiveKey("API_KEY")).toBe(true);
    expect(isSensitiveKey("AUTH_TOKEN")).toBe(true);
    expect(isSensitiveKey("SECRET_KEY")).toBe(true);
    expect(isSensitiveKey("PRIVATE_KEY")).toBe(true);
  });

  it("allows non-sensitive key names", () => {
    expect(isSensitiveKey("APP_NAME")).toBe(false);
    expect(isSensitiveKey("PORT")).toBe(false);
    expect(isSensitiveKey("NODE_ENV")).toBe(false);
    expect(isSensitiveKey("LOG_LEVEL")).toBe(false);
  });

  it("uses custom patterns when provided", () => {
    const patterns = [/internal/i];
    expect(isSensitiveKey("INTERNAL_URL", patterns)).toBe(true);
    expect(isSensitiveKey("API_KEY", patterns)).toBe(false);
  });
});

describe("maskValue", () => {
  it("masks entire value by default", () => {
    expect(maskValue("supersecret")).toBe("********");
  });

  it("masks short values with up to 8 asterisks", () => {
    expect(maskValue("abc")).toBe("***");
  });

  it("returns empty string for empty input", () => {
    expect(maskValue("")).toBe("");
  });

  it("reveals last N characters when revealChars is set", () => {
    const result = maskValue("mysecrettoken", "*", 4);
    expect(result.endsWith("oken")).toBe(true);
    expect(result).toContain("*");
  });

  it("uses custom mask character", () => {
    expect(maskValue("hello", "#")).toBe("#####");
  });
});

describe("redactEnvMap", () => {
  const env = {
    APP_NAME: "myapp",
    DB_PASSWORD: "s3cr3t!",
    API_KEY: "abc123xyz",
    PORT: "3000",
    AUTH_TOKEN: "tok_live_abcdef",
  };

  it("masks sensitive keys and leaves others intact", () => {
    const redacted = redactEnvMap(env);
    expect(redacted.APP_NAME).toBe("myapp");
    expect(redacted.PORT).toBe("3000");
    expect(redacted.DB_PASSWORD).not.toBe("s3cr3t!");
    expect(redacted.API_KEY).not.toBe("abc123xyz");
    expect(redacted.AUTH_TOKEN).not.toBe("tok_live_abcdef");
  });

  it("does not mutate the original map", () => {
    redactEnvMap(env);
    expect(env.DB_PASSWORD).toBe("s3cr3t!");
  });

  it("supports revealChars option", () => {
    const redacted = redactEnvMap(env, { revealChars: 3 });
    expect(redacted.API_KEY.endsWith("xyz")).toBe(true);
  });

  it("supports custom patterns", () => {
    const redacted = redactEnvMap(
      { INTERNAL_URL: "http://internal", PORT: "8080" },
      { patterns: [/internal/i] }
    );
    expect(redacted.INTERNAL_URL).not.toBe("http://internal");
    expect(redacted.PORT).toBe("8080");
  });
});
