import { renderToString } from "solid-js/web";
import { describe, expect, it } from "vitest";
import type { ValidationAssertionGroup } from "../validation/reports";
import { ValidationAssertionTree } from "./ValidationAssertionTree";

const tree: ValidationAssertionGroup = {
  kind: "group",
  id: "assertions",
  label: "Assertions",
  expandedByDefault: true,
  children: [
    {
      kind: "group",
      id: "assertions.frame",
      label: "Frame",
      expandedByDefault: true,
      children: [
        {
          kind: "assertion",
          id: "FRAME-001",
          label: "The frame is square.",
          expandedByDefault: false,
          assertion: {
            id: "FRAME-001",
            severity: "error",
            category: "structural",
            status: "passed",
            method: "deterministic constraint",
            sentence: "The frame is square.",
            message: "FRAME-001: the frame is square; measured 0, expected 0",
            references: ["part:front-top"],
            measured: 0,
            expected: 0,
          },
          children: [
            {
              kind: "detail",
              id: "FRAME-001.measured",
              label: "Measured value",
              value: 0,
            },
          ],
        },
      ],
    },
  ],
};

describe("ValidationAssertionTree", () => {
  it("opens groups while leaving individual assertion details collapsed", () => {
    const html = renderToString(() => ValidationAssertionTree({ tree }));

    expect(html).toContain("Assertions");
    expect(html).toContain("Frame");
    expect(html).toContain("The frame is square.");
    expect(html).toContain("Measured value");
    expect(html.match(/<details open/g)).toHaveLength(2);
    expect(html).toContain("<details><summary><span>The frame is square.</span>");
  });
});
