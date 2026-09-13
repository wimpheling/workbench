import { describe, expect, it } from "vitest";
import { playbackPhases } from "./playback";

const doorIds = ["front-left", "front-right", "left-rear", "back-right"];

describe("door playback sequence", () => {
  it("keeps bifolds closed until both front leaves finish opening", () => {
    const phases = playbackPhases("opening", doorIds);

    expect(phases[1].to).toEqual({
      "front-left": 1,
      "front-right": 1,
      "left-rear": 0,
      "back-right": 0,
    });
    expect(phases[2].from).toEqual(phases[1].to);
    expect(phases[2].to).toEqual({
      "front-left": 1,
      "front-right": 1,
      "left-rear": 1,
      "back-right": 1,
    });
  });
});
