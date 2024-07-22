import { AbstractShapeMaker } from "../../lib/AbstractShapeMaker";

const VIGA_WIDTH = 5;

export class EnclosureShapeMaker extends AbstractShapeMaker {
    viga(props: {
        height: number;
        depth: number;
        color?: string;
        dimensions?: boolean;
        name: string;
        assemble: (obj: THREE.Object3D) => void;
        group: string;
    }) {
        return this.makeShape({
            ...props,
            width: VIGA_WIDTH,
            material: "wood",
        });
    }
}