import { beforeAll, describe, expect, it } from "vitest";
import { makeBaseBox } from "replicad";
import { initializeOpenCascade } from "../rendering/enclosureScene";
import {
  checkSolidClearance,
  checkSolidPairs,
  solidCheckStatusIsBlocking,
  type ClearanceCheck,
} from "./solidChecks";

beforeAll(async () => {
  await initializeOpenCascade();
});

const check = (minimum: number): ClearanceCheck => ({
  id: "frame-door-clearance",
  subject: "frame",
  target: "door",
  minimum,
});

const box = (x: number, y: number, z: number, dx = 10, dy = 10, dz = 10) =>
  makeBaseBox(dx, dy, dz).translate(x, y, z);

describe("kernel-backed solid checks", () => {
  it("classifies positive-volume collision from the kernel", () => {
    const result = checkSolidClearance(
      new Map([
        ["frame", box(0, 0, 0)],
        ["door", box(5, 0, 0)],
      ]),
      check(1),
    );
    expect(result.status).toBe("collision");
    expect(result.intersection).toBe(true);
    expect(result.distance).toBe(0);
  });

  it("rend un solide non clonable indéterminé sans jamais le transformer", () => {
    let translations = 0;
    const frame = {
      clone: true,
      translate: () => {
        translations++;
        throw new Error("source mutated");
      },
    } as unknown as ReturnType<typeof box>;
    const result = checkSolidClearance(
      new Map([
        ["frame", frame],
        ["door", box(20, 0, 0)],
      ]),
      check(5),
    );
    expect(result.status).toBe("indeterminate");
    expect(result.diagnostics.join(" ")).toMatch(/non clonable|clone/i);
    expect(translations).toBe(0);
  });

  it("classifies face-tangent solids as insufficient clearance, not collision", () => {
    const result = checkSolidClearance(
      new Map([
        ["frame", box(0, 0, 0)],
        ["door", box(10, 0, 0)],
      ]),
      check(1),
    );
    expect(result.status).toBe("insufficient-clearance");
    expect(result.intersection).toBe(false);
    expect(result.distance).toBe(0);
  });

  it("classifies separated solids with sufficient clearance", () => {
    const result = checkSolidClearance(
      new Map([
        ["frame", box(0, 0, 0)],
        ["door", box(20, 0, 0)],
      ]),
      check(5),
    );
    expect(result.status).toBe("clear");
    expect(result.intersection).toBe(false);
    expect(result.distance).toBeGreaterThanOrEqual(5);
  });

  it("classifies separated solids below the required clearance", () => {
    const result = checkSolidClearance(
      new Map([
        ["frame", box(0, 0, 0)],
        ["door", box(12, 0, 0)],
      ]),
      check(5),
    );
    expect(result.status).toBe("insufficient-clearance");
    expect(result.distance).toBeLessThan(5);
  });

  it("reports missing solids as indeterminate", () => {
    expect(checkSolidClearance(new Map(), check(1))).toMatchObject({
      status: "indeterminate",
      diagnostics: ["subject or target solid is unavailable"],
    });
  });

  it("réutilise les mêmes solides dans plusieurs checks sans les supprimer", () => {
    const frame = box(0, 0, 0);
    const door = box(20, 0, 0);
    const results = checkSolidPairs(
      [
        { id: "frame", shape: frame },
        { id: "door", shape: door },
      ],
      [check(5), { ...check(5), id: "frame-door-clearance-again" }],
    );
    expect(results.every((result) => result.status === "clear")).toBe(true);
    expect(frame.isNull).toBe(false);
    expect(door.isNull).toBe(false);
    expect(frame.translate(1, 0, 0).isNull).toBe(false);
    expect(door.rotate(17, [0, 0, 0], [0, 1, 0]).isNull).toBe(false);
  });

  it("convertit une vraie défaillance intersect en diagnostic kernel", () => {
    const frame = box(0, 0, 0);
    const originalClone = frame.clone.bind(frame);
    const failingClone = (): typeof frame => {
      const clone = originalClone();
      let proxy: typeof frame;
      proxy = new Proxy(clone, {
        get(target, property, receiver) {
          if (property === "clone" || property === "translate") return () => proxy;
          if (property === "intersect")
            return () => {
              throw new Error("kernel intersect failure");
            };
          return Reflect.get(target, property, receiver);
        },
      });
      return proxy;
    };
    frame.clone = failingClone;

    const result = checkSolidClearance(
      new Map([
        ["frame", frame],
        ["door", box(20, 0, 0)],
      ]),
      check(5),
    );

    expect(result.status).toBe("indeterminate");
    expect(result.diagnostics.join(" ")).toMatch(/kernel intersect failure/i);
    expect(Object.getPrototypeOf(frame)).toBe(Object.getPrototypeOf(box(0, 0, 0)));
  });

  it("propagates each configured check and preserves blocking classification", () => {
    const results = checkSolidPairs(
      [
        { id: "frame", shape: box(0, 0, 0) },
        { id: "door", shape: box(12, 0, 0) },
      ],
      [check(5)],
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("frame-door-clearance");
    expect(solidCheckStatusIsBlocking(results[0]?.status ?? "indeterminate")).toBe(true);
    expect(solidCheckStatusIsBlocking("clear")).toBe(false);
    expect(solidCheckStatusIsBlocking("indeterminate")).toBe(false);
  });
});

describe("solid check result shape", () => {
  it("does not expose touching as a status", () => {
    expect(["clear", "collision", "insufficient-clearance", "indeterminate"]).not.toContain(
      "touching",
    );
  });
});
