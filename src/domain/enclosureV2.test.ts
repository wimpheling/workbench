import { describe, expect, it } from "vitest";
import { makeEnclosureV2 } from "./enclosureV2";
import { validateModel } from "../validation/constraints";

const historicalDimensions = { width: 1674, height: 740, depth: 1649 };

const member = (id: string) => {
  const result = makeEnclosureV2(historicalDimensions).members.find(
    (item) => item.id === `part:${id}`,
  );
  if (!result) throw new Error(`Missing member: ${id}`);
  return result;
};

describe("EnclosureV2 clear-volume design", () => {
  it("derives structural member centres and cut lengths from the clear boundaries", () => {
    expect(member("left-bottom-rail").length).toBeCloseTo(1649);
    expect(member("left-bottom-rail").transform.position).toMatchObject({
      x: -15,
      y: -15,
      z: -824.5,
    });

    expect(member("front-bottom-rail").length).toBeCloseTo(1734);
    expect(member("front-bottom-rail").transform.position).toMatchObject({
      x: 837,
      y: -15,
      z: 15,
    });

    expect(member("front-left-post").length).toBeCloseTo(740);
    expect(member("front-left-post").transform.position).toMatchObject({ x: -30, y: 370, z: 15 });
    expect(member("back-middle-support").length).toBeCloseTo(740);
    expect(member("back-middle-support").transform.position).toMatchObject({
      x: 837,
      y: 370,
      z: -1664,
    });
  });

  it("places inset-door hinge axes on the outside/front leaf corners", () => {
    const model = makeEnclosureV2(historicalDimensions);
    expect(model.anchors["anchor:left-hinge"]?.position).toEqual({ x: 3, y: 3, z: 30 });
    expect(model.anchors["anchor:right-hinge"]?.position).toEqual({ x: 1671, y: 3, z: 30 });
  });

  it("derives two symmetric inset leaves from the clear opening", () => {
    const model = makeEnclosureV2({ width: 1200, height: 800, depth: 600 });
    expect(model.doors).toHaveLength(2);
    expect(model.doors).toEqual([
      { id: "left-door", nominalWidth: 595.5, nominalHeight: 794 },
      { id: "right-door", nominalWidth: 595.5, nominalHeight: 794 },
    ]);
    expect(model.innerClearDimensionsMm).toEqual({ widthMm: 1200, heightMm: 800, depthMm: 600 });
    expect(model.dimensions).toEqual({ x: 1200, y: 800, z: 600 });
    expect(model.practicalFrontAccessEnvelopeMm).toMatchObject({
      widthMm: 1124,
      heightMm: 800,
      thicknessMm: 600,
      fullyOpenDoorAngleDeg: 90,
    });
  });

  it("models the complete structural topology as 24 nominal butt joints", () => {
    const model = makeEnclosureV2(historicalDimensions);
    expect(model.connections).toHaveLength(24);
    expect(model.connections.every((connection) => connection.joint?.kind === "butt")).toBe(true);
    expect(new Set(model.connections.flatMap((connection) => connection.parts))).toEqual(
      new Set(model.members.map((frameMember) => String(frameMember.id))),
    );
    expect(
      model.connections.find((connection) => connection.id === "joint:front-left-post-top"),
    ).toMatchObject({
      joint: {
        terminatingMember: "part:front-left-post",
        supportingMember: "part:front-top",
        terminatingFace: "end",
        supportingFace: "bottom",
        expectedContactAreaMm2: 1800,
        toleranceMm: 0.1,
      },
    });
    for (const connection of model.connections) {
      if (connection.joint?.kind !== "butt") throw new Error("Expected a structural butt joint");
      const terminatingMember = model.members.find(
        (candidate) => candidate.id === connection.joint?.terminatingMember,
      );
      expect(connection.joint.expectedContactAreaMm2).toBe(
        terminatingMember?.profile === "profile:aluminium-3060" ? 1800 : 900,
      );
    }
  });

  it("reports unknown structural connection members and invalid butt parameters", () => {
    const model = makeEnclosureV2(historicalDimensions);
    const invalid = {
      ...model,
      connections: [
        ...model.connections,
        {
          id: "joint:invalid",
          parts: ["part:missing", "part:front-top"],
          joint: {
            kind: "butt" as const,
            terminatingMember: "part:missing",
            supportingMember: "part:front-top",
            terminatingFace: "start" as const,
            supportingFace: "bottom" as const,
            expectedContactAreaMm2: 0,
            toleranceMm: -1,
          },
        },
      ],
    };
    const failures = validateModel(invalid).filter((constraint) => !constraint.passed);
    expect(failures.map((constraint) => constraint.id)).toContain(
      "JOINT-001.joint:invalid.member-references",
    );
    expect(failures.map((constraint) => constraint.id)).toContain("joint:invalid.butt-parameters");
  });

  it("rejects an incomplete structural connection topology", () => {
    const model = makeEnclosureV2(historicalDimensions);
    const failures = validateModel({ ...model, connections: model.connections.slice(1) }).filter(
      (constraint) => !constraint.passed,
    );
    expect(failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "JOINT-001.complete-structural-topology",
          measured: 23,
          expected: 24,
        }),
      ]),
    );
  });
});
