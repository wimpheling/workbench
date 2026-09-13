import { describe, expect, it } from "vitest";
import { makeProvisionalDoorInterfaceSpec } from "./doorInterfaces";
import { defaultEnclosureV2Variables } from "./enclosureV2Design";

const variables = defaultEnclosureV2Variables({
  innerClearWidthMm: 1200,
  innerClearHeightMm: 800,
  innerClearDepthMm: 600,
});

describe("provisional door-interface specification", () => {
  it("declares every closed-state interface for both leaves without selecting hardware", () => {
    const spec = makeProvisionalDoorInterfaceSpec(variables);

    expect(spec.status).toBe("provisional-unconfigured");
    expect(spec.interfaces.map((item) => item.id)).toEqual([
      "left-door.hinge-edge",
      "left-door.top",
      "left-door.bottom",
      "left-door.meeting-stile",
      "right-door.hinge-edge",
      "right-door.top",
      "right-door.bottom",
      "right-door.meeting-stile",
    ]);
    expect(spec.interfaces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "left-door.hinge-edge",
          hardPartClearance: {
            status: "provisional-override",
            sourceVariable: "frontDoorSideClearanceMm",
            nominalHardGapMm: 3,
          },
          closedStop: { status: "unconfigured" },
          sealContact: { status: "unconfigured" },
          overlap: { status: "unconfigured" },
          hardwareKeepOut: { status: "unconfigured" },
        }),
        expect.objectContaining({
          id: "right-door.meeting-stile",
          hardPartClearance: {
            status: "provisional-override",
            sourceVariable: "frontDoorCentreGapMm",
            nominalHardGapMm: 3,
          },
        }),
      ]),
    );
  });

  it("reflects authored provisional overrides without deriving new geometry", () => {
    const spec = makeProvisionalDoorInterfaceSpec({
      ...variables,
      frontDoorTopClearanceMm: 4,
      frontDoorCentreGapMm: 5,
    });

    expect(spec.interfaces.find((item) => item.id === "left-door.top")?.hardPartClearance).toEqual({
      status: "provisional-override",
      sourceVariable: "frontDoorTopClearanceMm",
      nominalHardGapMm: 4,
    });
    expect(
      spec.interfaces.find((item) => item.id === "right-door.meeting-stile")?.hardPartClearance,
    ).toEqual({
      status: "provisional-override",
      sourceVariable: "frontDoorCentreGapMm",
      nominalHardGapMm: 5,
    });
  });
});
