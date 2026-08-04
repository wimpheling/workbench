import { describe, expect, it } from "vitest";
import { makeEnclosureV2 } from "./enclosureV2";
import { evaluateEnclosureV2DesignConstraints } from "./enclosureV2DesignConstraints";

describe("EnclosureV2 executable design constraints", () => {
  it("satisfies every member-boundary and inset-door constraint after evaluation", () => {
    const results = evaluateEnclosureV2DesignConstraints(
      makeEnclosureV2({ width: 1200, height: 800, depth: 600 }),
    );
    expect(results).toHaveLength(35);
    expect(results.every((result) => result.status === "satisfied")).toBe(true);
  });

  it("reports the human specification and residual when a member is displaced", () => {
    const model = makeEnclosureV2({ width: 1200, height: 800, depth: 600 });
    const changed = {
      ...model,
      members: model.members.map((member) =>
        member.id === "part:front-top"
          ? {
              ...member,
              transform: {
                ...member.transform,
                position: { ...member.transform.position, y: member.transform.position.y + 4 },
              },
            }
          : member,
      ),
    };
    const failure = evaluateEnclosureV2DesignConstraints(changed).find(
      (result) => result.constraint.id === "FRAME-006.part:front-top.center",
    );
    expect(failure).toMatchObject({ status: "violated", measured: 4, expected: 0, residual: 4 });
    expect(failure?.constraint.description).toMatch(/clear-volume boundaries/i);
  });
});
