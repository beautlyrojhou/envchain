import { interpolateValue, interpolateEnvMap, detectCircularRefs } from "./interpolator";

describe("interpolateValue", () => {
  it("replaces ${VAR} syntax", () => {
    expect(interpolateValue("Hello ${NAME}", { NAME: "World" })).toBe("Hello World");
  });

  it("replaces $VAR bare syntax", () => {
    expect(interpolateValue("$PROTO://host", { PROTO: "https" })).toBe("https://host");
  });

  it("leaves unknown references unchanged", () => {
    expect(interpolateValue("${MISSING}", {})).toBe("${MISSING}");
  });

  it("replaces multiple references in one value", () => {
    const source = { HOST: "localhost", PORT: "5432" };
    expect(interpolateValue("${HOST}:${PORT}", source)).toBe("localhost:5432");
  });

  it("handles value with no references", () => {
    expect(interpolateValue("plain-value", { A: "b" })).toBe("plain-value");
  });
});

describe("interpolateEnvMap", () => {
  it("resolves self-references within the map", () => {
    const map = { HOST: "localhost", URL: "http://${HOST}/api" };
    const result = interpolateEnvMap(map);
    expect(result.URL).toBe("http://localhost/api");
  });

  it("prefers base map values over own keys for resolution", () => {
    const map = { URL: "http://${HOST}/api" };
    const base = { HOST: "prod.example.com" };
    const result = interpolateEnvMap(map, base);
    expect(result.URL).toBe("http://prod.example.com/api");
  });

  it("does not mutate the original map", () => {
    const map = { A: "${B}", B: "hello" };
    interpolateEnvMap(map);
    expect(map.A).toBe("${B}");
  });

  it("handles forward references", () => {
    const map = { GREETING: "${WORD} world", WORD: "hello" };
    const result = interpolateEnvMap(map);
    expect(result.GREETING).toBe("hello world");
  });

  it("returns empty object for empty input", () => {
    expect(interpolateEnvMap({})).toEqual({});
  });
});

describe("detectCircularRefs", () => {
  it("detects a direct self-reference", () => {
    const map = { A: "${A}" };
    expect(detectCircularRefs(map)).toContain("A");
  });

  it("detects a two-key mutual cycle", () => {
    const map = { A: "${B}", B: "${A}" };
    const result = detectCircularRefs(map);
    expect(result).toContain("A");
  });

  it("returns empty array when no cycles exist", () => {
    const map = { A: "hello", B: "${A}" };
    expect(detectCircularRefs(map)).toHaveLength(0);
  });

  it("returns empty array for empty map", () => {
    expect(detectCircularRefs({})).toHaveLength(0);
  });
});
