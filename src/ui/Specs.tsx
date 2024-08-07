import * as THREE from "three";
import { For } from "solid-js";
import { AbstractShapeMaker, Piece } from "../lib/AbstractShapeMaker";
import { TechDraw } from "./TechDraw";
import { specsKey } from "../lib/pieceHelpers";

// A little bit simplified version
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const groupBy = <T, K extends keyof any>(arr: T[], key: (i: T) => K) =>
  arr.reduce(
    (groups, item) => {
      (groups[key(item)] ||= []).push(item);
      return groups;
    },
    {} as Record<K, T[]>,
  );

export const Specs = ({ shapeMaker }: { shapeMaker: AbstractShapeMaker }) => {
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  return (
    <For each={Object.keys(shapeMaker.piecesBySpecs)}>
      {(key) => {
        const pieces = shapeMaker.piecesBySpecs[key] as Piece[];
        const grouped: Record<string, Piece[]> = groupBy(pieces, specsKey);
        return (
          <>
            <For each={Object.keys(grouped)}>
              {(key) => {
                const pieces = grouped[key] as Piece[];
                return (
                  <>
                    {key}
                    <br />
                    {pieces.length} piece{pieces.length === 1 ? "" : "s"}
                    <div class="tech-draw">
                      <For each={pieces}>
                        {(piece) => (
                          <>
                            <TechDraw piece={piece} renderer={renderer} />
                          </>
                        )}
                      </For>
                    </div>
                  </>
                );
              }}
            </For>
            <hr />
          </>
        );
      }}
    </For>
  );
};
