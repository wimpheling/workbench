import { describe, expect, it } from "vitest";
import {
  buildFrame3ddInput,
  parseFrame3ddResult,
  runFrame3dd,
  unavailableFrame3dd,
} from "./frame3dd";

describe("Frame3DD boundary", () => {
  it("returns an explicit unavailable result without a runner", async () => {
    expect(
      (await runFrame3dd(undefined, buildFrame3ddInput("m", "1", [], [], [], [], []))).status,
    ).toBe("unavailable");
    expect(unavailableFrame3dd().diagnostics).toHaveLength(1);
  });
  it("rejects malformed result documents", () => {
    expect(parseFrame3ddResult("{}").status).toBe("failed");
  });
});
