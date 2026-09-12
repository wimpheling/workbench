import { describe, it, expect, vi, afterEach } from "vitest";
import { readResponse, signature, canExport, download, type Evaluation } from "./api";
afterEach(() => vi.unstubAllGlobals());
describe("response handling", () => {
  it("preserves readable validation errors", async () => {
    await expect(
      readResponse(
        new Response(JSON.stringify({ detail: "width_mm must be positive" }), {
          status: 422,
        }),
      ),
    ).rejects.toThrow("422: width_mm must be positive");
  });
  it("preserves structured errors", async () => {
    await expect(
      readResponse(
        new Response(JSON.stringify({ detail: [{ msg: "missing field" }] }), {
          status: 422,
        }),
      ),
    ).rejects.toThrow("missing field");
  });
  it("reports server failures without JSON", async () => {
    await expect(
      readResponse(
        new Response("gateway down", {
          status: 502,
          statusText: "Bad Gateway",
        }),
      ),
    ).rejects.toThrow("Bad Gateway");
  });
  it("refuses stale exports at the server", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "revision changed" }), {
          status: 409,
        }),
      ),
    );
    await expect(download("pack", {}, {}, "old")).rejects.toThrow("409: revision changed");
  });
});
describe("revision safety", () => {
  const result = {
    model: { revision: "a" },
    report: { revision: "a" },
  } as Evaluation;
  it("is insensitive to parameter insertion order", () => {
    expect(signature({ a: 1, b: 2 }, { x: 0 })).toBe(signature({ b: 2, a: 1 }, { x: 0 }));
  });
  it("distinguishes pose changes", () => {
    expect(signature({ a: 1 }, { x: 0 })).not.toBe(signature({ a: 1 }, { x: 1 }));
  });
  it("permits quotation exports of evaluated incomplete designs", () => {
    expect(canExport(result, false, "current", "current")).toBe(true);
  });
  it("prevents exports when waiting, stale, missing, or mismatched", () => {
    expect(canExport(result, true, "a", "a")).toBe(false);
    expect(canExport(result, false, "b", "a")).toBe(false);
    expect(canExport(undefined, false, "a", "a")).toBe(false);
    expect(
      canExport({ ...result, report: { ...result.report, revision: "b" } }, false, "a", "a"),
    ).toBe(false);
  });
});
