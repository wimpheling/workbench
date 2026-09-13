import { describe, expect, it } from "vitest";
import { accessOpeningById, agreedAccessOpenings } from "./accessOpenings";

describe("agreed multi-face access topology", () => {
  it("names the front main doors and the two agreed service openings", () => {
    expect(agreedAccessOpenings.map((opening) => opening.id)).toEqual([
      "access-opening:front-main",
      "access-opening:left-rear",
      "access-opening:back-right",
    ]);
    expect(agreedAccessOpenings).toHaveLength(3);
  });

  it("keeps the access bounds as face-relative intent until frame geometry is evaluated", () => {
    expect(accessOpeningById("access-opening:front-main")).toMatchObject({
      face: "front",
      boundsIntent: {
        referencePlane: "face-opening-viewed-from-outside",
        horizontalCoverage: "full-face-width",
        verticalCoverage: "full-face-height",
        evaluatedBoundsStatus: "topology-only",
      },
    });
    expect(accessOpeningById("access-opening:left-rear").boundsIntent.horizontalCoverage).toBe(
      "rear-half-of-face",
    );
    expect(accessOpeningById("access-opening:back-right").boundsIntent.horizontalCoverage).toBe(
      "right-half-of-face",
    );
  });

  it("records outward folding and parking directions without selecting hardware", () => {
    expect(accessOpeningById("access-opening:front-main").doors).toMatchObject({
      kind: "outward-double",
      leafCount: 2,
      parkDirection: "split-left-and-right",
      leaves: [
        { id: "access-leaf:front-main-left", role: "primary" },
        { id: "access-leaf:front-main-right", role: "primary" },
      ],
    });
    expect(accessOpeningById("access-opening:left-rear").doors).toMatchObject({
      kind: "outward-bi-fold",
      leafCount: 2,
      parkDirection: "toward-back",
      leaves: [
        { id: "access-leaf:left-rear-frame", role: "frame-pivot" },
        { id: "access-leaf:left-rear-folding", role: "folding-mate" },
      ],
    });
    expect(accessOpeningById("access-opening:back-right").doors.parkDirection).toBe("toward-right");
  });

  it("makes inset panels the explicit intent for every access leaf", () => {
    for (const opening of agreedAccessOpenings) {
      expect(opening.panelIntent).toEqual({
        installation: "inset-in-door-frame-slots",
        sealAndRetainerStatus: "to-be-selected",
        slotAllocationStatus: "to-be-modelled",
      });
    }
  });
});
