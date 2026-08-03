# Agents Documentation for src/lib

This documentation describes the core library files for a 3D woodworking design and assembly system. The system uses Replicad for 3D modeling, Three.js for rendering, and SolidJS for UI.

## Overview

The `src/lib` folder contains core functionality for:

- 3D shape creation and management
- Joint creation (box joints, half-lap joints)
- Piece management and assembly
- 3D rendering and visualization
- Project configuration

## File Documentation

### 1. AbstractShapeMaker.ts

#### Purpose

Base class for creating and managing 3D shape makers. Provides functionality to define pieces, organize them into groups, and assemble them into a 3D scene.

#### Key Interfaces

```typescript
// Joint types
export interface BoxJoint {
  numberOfJoints: number;
  jointHeight: number;
  male: boolean;
  jointType: "box";
}

export interface HalfLapJoint {
  male: boolean;
  jointType: "halfLap";
  size: number;
  borderSize?: number;
}

export type Joint = BoxJoint | HalfLapJoint;

// Side configuration
export interface Side {
  joint?: Joint;
}

export interface Sides {
  left?: Side;
  right?: Side;
  front?: Side;
  back?: Side;
}

// Geometry properties
interface BoxGeometryProps {
  height: number;
  width: number;
  depth: number;
  type: "box";
  sides?: Sides;
  postProcess?: PostProcessHandler;
}

// Piece definition
export type Piece = Omit<MakeShapeProps, "x" | "y" | "z" | "scene"> & {
  material: string;
  group: string;
  assemble: (obj: THREE.Object3D) => void;
};
```

#### Main Class: AbstractShapeMaker

```typescript
export class AbstractShapeMaker {
  objectsByGroup: Record<string, Piece[]> = {};
  threeGroups: Record<string, THREE.Group> = {};
  piecesBySpecs: Record<string, Piece[]> = {};
  hiddenGroupsInSpecs: string[] = [];

  // Constructor
  constructor(hiddenGroupsInSpecs: string[] = []);

  // Methods
  makeShape(props: Piece): void;
  assemble(
    scene: THREE.Scene,
    conf: { hiddenGroups?: string[] },
  ): DisposableItem[];
}
```

#### Usage Example

```typescript
import { AbstractShapeMaker } from "./lib/AbstractShapeMaker";

class MyShapeMaker extends AbstractShapeMaker {
  constructor() {
    super(["internal-pieces"]); // Hide these groups from specs
  }

  createTableLeg() {
    this.makeShape({
      name: "Table Leg",
      material: "Oak",
      group: "legs",
      geometry: {
        type: "box",
        height: 80,
        width: 8,
        depth: 8,
        sides: {
          top: {
            joint: {
              type: "box",
              male: true,
              numberOfJoints: 2,
              jointHeight: 4,
            },
          },
        },
      },
      assemble: (obj) => {
        obj.position.set(0, 40, 0);
      },
    });
  }
}
```

---

### 2. MyObject3D.ts

#### Purpose

Defines the interface for 3D object configurations that hold shape maker instances and assembly settings.

#### Interface

```typescript
import { AbstractShapeMaker } from "./AbstractShapeMaker";

export interface MyObject3D {
  sm: AbstractShapeMaker;
  hiddenGroups: string[];
  hiddenGroupsInSpecs: string[];
}
```

#### Usage Example

```typescript
import { MyObject3D } from "./lib/MyObject3D";
import { MyShapeMaker } from "./MyShapeMaker";

export class MyProject implements MyObject3D {
  sm: MyShapeMaker;
  hiddenGroups: string[] = ["internal"];
  hiddenGroupsInSpecs: string[] = ["temporary"];

  constructor() {
    this.sm = new MyShapeMaker();
    this.sm.createTableLeg();
    this.sm.createTableTop();
  }
}
```

---

### 3. Renderer3D.tsx

#### Purpose

SolidJS component for rendering 3D objects with interactive controls for switching between assembly view and specifications view.

#### Component

```typescript
import { Show, createSignal } from "solid-js";
import { Specs } from "../ui/Specs";
import { Assembly } from "../ui/Assembly";
import { MyObject3D } from "./MyObject3D";
import projects from "./projects";

export function Renderer3D({ object3D }: { object3D: MyObject3D }) {
  const [showAssembled, setShowAssembled] = createSignal(true);
  return (
    <>
      <div style={{ top: 0, left: 0, "z-index": 1004, display: "flex" }}>
        <button onClick={() => setShowAssembled(!showAssembled())}>
          {showAssembled() ? "Show Specs" : "Show Assembly"}
        </button>
        <ul style={{ "list-style": "none", display: "flex" }}>
          {projects.map((project) => (
            <li style={{ "margin-right": "10px" }}>
              <a
                style={{ "text-decoration": "none" }}
                href={`/projects/${project}.html`}
              >
                {project}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <Show when={showAssembled()}>
        <Assembly item={object3D} />
      </Show>
      <Show when={!showAssembled()}>
        <Specs shapeMaker={object3D.sm} />
      </Show>
    </>
  );
}
```

---

### 4. boxJoint.ts

#### Purpose

Function to create box joints (finger joints) on 3D shapes.

#### Function

```typescript
import { makeBaseBox, Shape3D } from "replicad";

export function boxJoint({
  orientation,
  jointHeight,
  jointWidth,
  numberOfJoints,
  depth,
  male,
  geo,
  width,
  height,
}: {
  geo: Shape3D;
  jointHeight: number;
  jointWidth: number;
  numberOfJoints: number;
  depth: number;
  male: boolean;
  orientation:
    | {
        axis: "horizontal";
        cutDirection: "up" | "down";
      }
    | {
        axis: "vertical";
        cutDirection: "left" | "right";
      };
  width: number;
  height: number;
}): Shape3D;
```

#### Parameters

- `geo`: The base Shape3D to modify
- `jointHeight`: Height of each individual joint
- `jointWidth`: Width of each individual joint
- `numberOfJoints`: Number of joints to create
- `depth`: Depth of the piece
- `male`: Whether to create male (protruding) or female (recessed) joints
- `orientation`: Joint orientation (horizontal/vertical) and cut direction
- `width`: Total width of the piece
- `height`: Total height of the piece

#### Usage Example

```typescript
import { boxJoint } from "./lib/boxJoint";
import { makeBaseBox } from "replicad";

const baseShape = makeBaseBox(100, 50, 20);
const jointedShape = boxJoint({
  geo: baseShape,
  jointHeight: 10,
  jointWidth: 10,
  numberOfJoints: 4,
  depth: 20,
  male: true,
  orientation: { axis: "horizontal", cutDirection: "up" },
  width: 100,
  height: 50,
});
```

---

### 5. halfLapJoint.ts

#### Purpose

Function to create half-lap joints on 3D shapes.

#### Function

```typescript
import { makeBaseBox, Shape3D } from "replicad";

export function halfLapJoint({
  geo,
  sectionWidth,
  depth,
  sectionHeight,
  translateY,
  translateX,
}: {
  geo: Shape3D;
  sectionWidth: number;
  sectionHeight: number;
  depth: number;
  translateY: number;
  translateX: number;
});
```

#### Parameters

- `geo`: The base Shape3D to modify
- `sectionWidth`: Width of the lap joint section
- `sectionHeight`: Height of the lap joint section
- `depth`: Depth of the piece
- `translateX`: X-axis offset from center
- `translateY`: Y-axis offset from center

#### Usage Example

```typescript
import { halfLapJoint } from "./lib/halfLapJoint";
import { makeBaseBox } from "replicad";

const baseShape = makeBaseBox(100, 50, 20);
const jointedShape = halfLapJoint({
  geo: baseShape,
  sectionWidth: 100,
  sectionHeight: 25,
  depth: 20,
  translateY: 12.5,
  translateX: 0,
});
```

---

### 6. pieceHelpers.ts

#### Purpose

Utility functions for working with pieces and geometries.

#### Functions

```typescript
import { Piece } from "./AbstractShapeMaker";
import { Shape3D } from "replicad";

// Get geometry for a piece, applying any joints
export function getGeometry(props: Piece): Shape3D;

// Generate unique key for piece specifications
export function specsKey(props: Piece): string;
```

#### Usage Example

```typescript
import { getGeometry, specsKey } from "./lib/pieceHelpers";

const piece = {
  material: "Oak",
  geometry: {
    type: "box",
    height: 80,
    width: 8,
    depth: 8,
    sides: {
      top: {
        joint: { type: "box", male: true, numberOfJoints: 2, jointHeight: 4 },
      },
    },
  },
};

const geometry = getGeometry(piece);
const specs = specsKey(piece); // "Oak 80x8x8"
```

---

### 7. projects.ts

#### Purpose

Lists all available projects for navigation.

#### Content

```typescript
export default [
  "workbench",
  "enclosure",
  "montessoriLibrary",
  "test",
  "enclosureExtrusion",
];
```

---

### 8. render.tsx

#### Purpose

Utility for rendering 3D objects using SolidJS and Replicad. Handles initialization and rendering.

#### Function

```typescript
import { render } from "solid-js/web";

export function renderObject3D<A extends MyObject3D>(c: new () => A);
```

#### Usage Example

```typescript
import { renderObject3D } from "./lib/render";
import { MyProject } from "./MyProject";

renderObject3D(MyProject);
```

## API Documentation

### Creating Shape Makers

```typescript
import { AbstractShapeMaker, Piece } from "./lib/AbstractShapeMaker";

class CustomShapeMaker extends AbstractShapeMaker {
  constructor() {
    super(["internal-pieces"]); // Groups to hide from specifications
  }

  createCustomPiece(): void {
    const piece: Piece = {
      name: "Custom Piece",
      material: "Pine",
      group: "main",
      geometry: {
        type: "box",
        height: 100,
        width: 50,
        depth: 20,
        sides: {
          left: {
            joint: {
              jointType: "box",
              male: true,
              numberOfJoints: 3,
              jointHeight: 10,
            },
          },
          right: {
            joint: {
              jointType: "halfLap",
              male: false,
              size: 20,
            },
          },
        },
      },
      assemble: (obj) => {
        obj.position.set(0, 50, 0);
        obj.rotation.y = Math.PI / 4;
      },
    };

    this.makeShape(piece);
  }
}
```

### Creating Projects

```typescript
import { MyObject3D } from "./lib/MyObject3D";
import { CustomShapeMaker } from "./CustomShapeMaker";

export class MyProject implements MyObject3D {
  sm: CustomShapeMaker;
  hiddenGroups: string[] = ["internal"];
  hiddenGroupsInSpecs: string[] = ["temporary"];

  constructor() {
    this.sm = new CustomShapeMaker();
    this.sm.createCustomPiece();
    this.sm.createAnotherPiece();
  }
}

// Render the project
import { renderObject3D } from "./lib/render";
renderObject3D(MyProject);
```

### Working with Joints

#### Box Joint Configuration

```typescript
// Male box joint with 4 fingers
const boxJointConfig = {
  jointType: "box" as const,
  male: true,
  numberOfJoints: 4,
  jointHeight: 10,
};

// Female box joint that mates with the above
const femaleBoxJoint = {
  jointType: "box" as const,
  male: false,
  numberOfJoints: 4,
  jointHeight: 10,
};
```

#### Half-Lap Joint Configuration

```typescript
// Half-lap joint
const halfLapConfig = {
  jointType: "halfLap" as const,
  male: true,
  size: 25,
};
```

### Post-Processing Shapes

```typescript
const customPiece = {
  name: "Custom Piece",
  material: "Oak",
  group: "main",
  geometry: {
    type: "box",
    height: 100,
    width: 50,
    depth: 20,
    postProcess: (shape) => {
      // Add custom modifications to the shape
      return shape.fillet(5); // Radius of 5mm on all edges
    },
  },
  assemble: (obj) => {
    obj.position.set(0, 50, 0);
  },
};
```

## System Architecture

### Flow Diagram

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   MyObject3D     │    │  Shape Maker     │    │  Piece Helpers   │
│ (Project Config) │───►│  (Abstract Class)│───►│  (getGeometry)   │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Renderer3D     │    │    Make Shape    │    │     Joints       │
│  (UI Component)  │    │   (makeShape)    │    │  (box, halfLap)  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Three.js Scene  │    └──────────────────┘    └──────────────────┘
│  (Rendering)     │
└──────────────────┘
```

### Data Flow

1. **Initialization**: Project implements `MyObject3D` interface and creates shape maker
2. **Shape Definition**: Shape maker uses `makeShape()` to define pieces with joints
3. **Geometry Generation**: `getGeometry()` generates Replicad Shape3D with joints
4. **Assembly**: `assemble()` method positions pieces in 3D space
5. **Visualization**: Three.js renders the scene with interactive controls

## Best Practices

1. **Organize into Groups**: Use groups to organize pieces for easier management
2. **Hide Internal Pieces**: Use `hiddenGroupsInSpecs` to exclude internal pieces from specifications
3. **Modular Design**: Create separate shape maker methods for each component type
4. **Consistent Materials**: Define standard materials for your project
5. **Use Joint Mating**: Ensure male and female joints have matching dimensions
6. **Leverage Post-Processing**: Use `postProcess` to add fillets, chamfers, and other modifications

## Advanced Techniques

### Custom Joint Types

```typescript
// Extend joint types in AbstractShapeMaker.ts
export interface DovetailJoint {
  jointType: "dovetail";
  angle: number;
  numberOfJoints: number;
  size: number;
}

export type Joint = BoxJoint | HalfLapJoint | DovetailJoint;

// Create function in pieceHelpers.ts
export function dovetailJoint({
  geo,
  angle,
  numberOfJoints,
  size,
  width,
  height,
  depth,
}: {
  geo: Shape3D;
  angle: number;
  numberOfJoints: number;
  size: number;
  width: number;
  height: number;
  depth: number;
}): Shape3D {
  // Implementation
}

// Update getGeometry() to handle new joint type
if (joint.jointType === "dovetail") {
  geoShape = dovetailJoint({
    geo: geoShape,
    angle: joint.angle,
    numberOfJoints: joint.numberOfJoints,
    size: joint.size,
    width: props.geometry.width,
    height: props.geometry.height,
    depth: props.geometry.depth,
  });
}
```

### Performance Optimization

```typescript
// Reuse geometries across similar pieces
const sharedGeometry = {
  type: "box",
  height: 100,
  width: 50,
  depth: 20,
  sides: {
    left: {
      joint: { type: "box", male: true, numberOfJoints: 3, jointHeight: 10 },
    },
  },
};

// Create multiple pieces with same geometry
for (let i = 0; i < 4; i++) {
  this.makeShape({
    name: `Piece ${i}`,
    material: "Oak",
    group: "repeating",
    geometry: sharedGeometry,
    assemble: (obj) => {
      obj.position.set(i * 60, 50, 0);
    },
  });
}
```

This documentation provides a comprehensive guide to working with the src/lib files. By following the patterns and examples, you can create complex 3D woodworking projects with accurate joinery and professional specifications.
