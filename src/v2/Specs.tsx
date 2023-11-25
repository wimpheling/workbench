import { For } from "solid-js";
import { WorkBench } from "./workbench";
import { Piece } from "./AbstractShapeMaker";
import { TechDraw } from "./TechDraw";

// A little bit simplified version
const groupBy = <T, K extends keyof any>(arr: T[], key: (i: T) => K) =>
  arr.reduce((groups, item) => {
    (groups[key(item)] ||= []).push(item);
    return groups;
  }, {} as Record<K, T[]>);

export const Specs = () => {
  const workbench = new WorkBench();
  return (
    <For each={Object.keys(workbench.sm.objectsByGroup)}>
      {(key) => {
        const pieces = workbench.sm.objectsByGroup[key] as Piece[];
        const grouped: Record<string, Piece[]> = groupBy(
          pieces,
          (piece) => `${piece.width}x${piece.height}x${piece.depth}`
        );
        return (
          <>
            {key}
            <br />
            <For each={Object.keys(grouped)}>
              {(key) => {
                const pieces = grouped[key] as Piece[];
                return (
                  <>
                    {key}
                    <br />
                    <div class="tech-draw">
                      <For each={pieces}>
                        {(piece) => (
                          <>
                            <TechDraw piece={piece} />
                          </>
                        )}
                      </For>
                    </div>
                  </>
                );
              }}
            </For>
          </>
        );
      }}
    </For>
  );
};
