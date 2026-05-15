import { describe, it, expect } from "vitest";
import {
  applyRenameRules,
  applyAffixes,
  renameEnvMap,
} from "./renamer";

describe("applyRenameRules", () => {
  it("renames a matching key", () => {
    expect(applyRenameRules("OLD_KEY", [{ from: "OLD_KEY", to: "NEW_KEY" }])).toBe("NEW_KEY");
  });

  it("returns original key when no rule matches", () => {
    expect(applyRenameRules("UNCHANGED", [{ from: "OTHER", to: "X" }])).toBe("UNCHANGED");
  });

  it("returns original key for empty rules array", () => {
    expect(applyRenameRules("FOO", [])).toBe("FOO");
  });
});

describe("applyAffixes", () => {
  it("adds a prefix", () => {
    expect(applyAffixes("KEY", "APP_")).toBe("APP_KEY");
  });

  it("adds a suffix", () => {
    expect(applyAffixes("KEY", undefined, "_PROD")).toBe("KEY_PROD");
  });

  it("strips a prefix before adding new prefix", () => {
    expect(applyAffixes("OLD_KEY", "NEW_", undefined, "OLD_")).toBe("NEW_KEY");
  });

  it("applies all transforms in order", () => {
    expect(applyAffixes("OLD_KEY", "APP_", "_V2", "OLD_")).toBe("APP_KEY_V2");
  });

  it("returns key unchanged when no options provided", () => {
    expect(applyAffixes("KEY")).toBe("KEY");
  });
});

describe("renameEnvMap", () => {
  it("renames keys using explicit rules", () => {
    const result = renameEnvMap(
      { OLD_HOST: "localhost", PORT: "3000" },
      { rules: [{ from: "OLD_HOST", to: "HOST" }] }
    );
    expect(result).toEqual({ HOST: "localhost", PORT: "3000" });
  });

  it("adds prefix to all keys", () => {
    const result = renameEnvMap({ HOST: "localhost", PORT: "3000" }, { prefix: "APP_" });
    expect(result).toEqual({ APP_HOST: "localhost", APP_PORT: "3000" });
  });

  it("strips prefix and adds new prefix", () => {
    const result = renameEnvMap(
      { STAGE_HOST: "localhost" },
      { prefix: "PROD_", stripPrefix: "STAGE_" }
    );
    expect(result).toEqual({ PROD_HOST: "localhost" });
  });

  it("explicit rules take precedence over affixes", () => {
    const result = renameEnvMap(
      { FOO: "bar" },
      { prefix: "X_", rules: [{ from: "FOO", to: "BAZ" }] }
    );
    expect(result).toEqual({ BAZ: "bar" });
  });

  it("throws on rename collision", () => {
    expect(() =>
      renameEnvMap(
        { A_KEY: "1", B_KEY: "2" },
        { rules: [{ from: "A_KEY", to: "KEY" }, { from: "B_KEY", to: "KEY" }] }
      )
    ).toThrow(/collision/);
  });

  it("returns empty object for empty input", () => {
    expect(renameEnvMap({}, { prefix: "X_" })).toEqual({});
  });
});
