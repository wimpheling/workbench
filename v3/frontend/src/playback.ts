export type PlaybackDirection = "opening" | "closing";

export type PlaybackPhase = {
  ids: string[];
  from: Record<string, number>;
  to: Record<string, number>;
  duration: number;
};

export function playbackPhases(
  direction: PlaybackDirection,
  doorIds: readonly string[],
): PlaybackPhase[] {
  const closed = Object.fromEntries(doorIds.map((id) => [id, 0])) as Record<string, number>;
  const opened = Object.fromEntries(doorIds.map((id) => [id, 1])) as Record<string, number>;

  return direction === "opening"
    ? [
        {
          ids: ["front-right"],
          from: closed,
          to: { ...closed, "front-right": 1 },
          duration: 800,
        },
        {
          ids: ["front-left"],
          from: { ...closed, "front-right": 1 },
          to: { ...closed, "front-right": 1, "front-left": 1 },
          duration: 800,
        },
        {
          ids: ["left-rear", "back-right"],
          from: { ...closed, "front-right": 1, "front-left": 1 },
          to: opened,
          duration: 900,
        },
      ]
    : [
        {
          ids: ["left-rear", "back-right"],
          from: opened,
          to: { ...opened, "left-rear": 0, "back-right": 0 },
          duration: 900,
        },
        {
          ids: ["front-left"],
          from: { ...opened, "left-rear": 0, "back-right": 0 },
          to: { ...closed, "front-right": 1 },
          duration: 800,
        },
        {
          ids: ["front-right"],
          from: { ...closed, "front-right": 1 },
          to: closed,
          duration: 800,
        },
      ];
}
