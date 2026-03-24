# Homemade Design Tool

A comprehensive DIY design and modeling tool for creating wooden furniture and structures with precise joinery. This framework allows users to design, customize, and visualize projects in 3D with interactive controls for dimensions, materials, and joinery types.

## Project Overview

This homemade design tool is built with modern web technologies to provide a user-friendly interface for designing wooden furniture and structures. It features:

- Interactive 3D visualization of projects
- Real-time dimension adjustments
- Support for various joinery types (box joints, half-lap joints, etc.)
- Project management and customization capabilities
- Technical drawing generation
- Material and cutting specifications

The tool is designed to be extensible, allowing users to create custom projects, define new piece types, and implement specific joinery methods.

## Installation Instructions

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation Steps

1. Clone or download the project repository
2. Navigate to the project directory:
   ```bash
   cd workbench
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to the URL provided (typically `http://localhost:5173`)

## Usage Guide

### Opening Existing Projects

1. When you first start the application, you'll see a list of available projects
2. Click on any project to open it in the 3D viewer
3. Use the controls in the sidebar to adjust dimensions and parameters
4. Switch between 3D view and technical drawing view using the tabs

### Main Controls

- **Zoom**: Mouse wheel or pinch gesture
- **Pan**: Right-click and drag
- **Rotate**: Left-click and drag
- **Dimensions**: Use the input fields in the sidebar to adjust sizes

### Technical Drawings

1. Click on the "Technical Drawing" tab to view detailed plans
2. The drawing includes:
   - Exploded views with dimensions
   - Cutting layouts for materials
   - Joinery details
   - Material list

## Project Structure

The project is organized as follows:

```
workbench/
├── src/                      # Source code directory
│   ├── lib/                  # Core library files
│   │   ├── AbstractShapeMaker.ts    # Base class for shape creation
│   │   ├── pieceHelpers.ts         # Helper functions for working with pieces
│   │   ├── projects.ts             # Project management utilities
│   │   ├── boxJoint.ts             # Box joint implementation
│   │   ├── halfLapJoint.ts         # Half-lap joint implementation
│   │   ├── render.tsx              # Rendering utilities
│   │   └── Renderer3D.tsx          # 3D rendering component
│   ├── projects/             # Project-specific files
│   │   ├── workbench/        # Workbench project
│   │   │   ├── workbench.ts        # Main project file
│   │   │   ├── WorkbenchShapeMaker.ts # Shape creation logic
│   │   │   ├── consts.ts           # Constants and defaults
│   │   │   └── constraints.ts      # Constraints and rules
│   │   ├── montessoriLibrary/      # Montessori library project
│   │   ├── enclosure/              # Enclosure project
│   │   └── test/                   # Test project
│   ├── ui/                   # User interface components
│   │   ├── Assembly.tsx       # Main assembly view
│   │   ├── TechDraw.tsx       # Technical drawing component
│   │   └── Specs.tsx          # Specifications component
│   └── vite-env.d.ts         # Vite environment definitions
├── projects/                 # Output directory for built projects
├── public/                   # Static files
├── index.html                # Entry point
├── package.json              # Dependencies and scripts
└── vite.config.js            # Vite configuration
```

## How to Create New Projects

### Step-by-Step Guide

1. Create a new directory in `src/projects/`:

   ```bash
   mkdir src/projects/myNewProject
   ```

2. Create the main project file (e.g., `myNewProject.tsx`):

   ```typescript
   import React from 'react';
   import { MyProjectShapeMaker } from './MyProjectShapeMaker';
   import { MyProjectConst } from './MyProjectConst';
   import { Piece } from '../lib/pieceHelpers';
   import { Assembly } from '../ui/Assembly';

   // Define your project parameters
   export type MyProjectParams = {
     width: number;
     height: number;
     depth: number;
   };

   // Create your project component
   export const MyNewProject: React.FC = () => {
     // Initialize parameters
     const params: MyProjectParams = {
       width: MyProjectConst.WIDTH,
       height: MyProjectConst.HEIGHT,
       depth: MyProjectConst.DEPTH,
     };

     // Create shape maker instance
     const shapeMaker = new MyProjectShapeMaker(params);

     // Generate pieces
     const pieces = shapeMaker.generatePieces();

     return (
       <Assembly
         pieces={pieces}
         title="My New Project"
       />
     );
   };
   ```

3. Create a shape maker file (e.g., `MyProjectShapeMaker.ts`):

   ```typescript
   import { AbstractShapeMaker } from "../lib/AbstractShapeMaker";
   import { MyProjectParams } from "./myNewProject";
   import { Piece } from "../lib/pieceHelpers";

   export class MyProjectShapeMaker extends AbstractShapeMaker {
     private params: MyProjectParams;

     constructor(params: MyProjectParams) {
       super();
       this.params = params;
     }

     generatePieces(): Piece[] {
       const pieces: Piece[] = [];

       // Create your project pieces here
       // Use pieceHelpers functions to define pieces and joints

       return pieces;
     }
   }
   ```

4. Create constants file (e.g., `MyProjectConst.ts`):

   ```typescript
   export const MyProjectConst = {
     WIDTH: 1000,
     HEIGHT: 800,
     DEPTH: 600,
     THICKNESS: 18,
   };
   ```

5. Add your project to `src/lib/projects.ts`:

   ```typescript
   import { MyNewProject } from "../projects/myNewProject/myNewProject";

   export const projects = [
     {
       name: "My New Project",
       component: MyNewProject,
       description: "A custom project created with the homemade design tool",
     },
     // Other existing projects
   ];
   ```

6. Build the project:
   ```bash
   npm run build
   ```

## How to Customize Pieces and Joints

### Creating Custom Pieces

Use the `createPiece()` function from `pieceHelpers.ts` to define new piece types:

```typescript
import { createPiece } from "../lib/pieceHelpers";

const myPiece = createPiece({
  id: "my-custom-piece",
  dimensions: {
    width: 1000,
    height: 800,
    depth: 18,
  },
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  material: "plywood",
  name: "Custom Piece",
});
```

### Implementing Custom Joints

Extend existing joint implementations or create new ones using the joint system:

```typescript
import { createBoxJoint } from "../lib/boxJoint";

// Custom box joint with specific parameters
const customBoxJoint = createBoxJoint({
  piece1: pieceA,
  piece2: pieceB,
  cutDepth: 9,
  cutWidth: 9,
  position: "front",
  direction: "vertical",
});
```

### Customizing Materials

Define new material types in the specifications:

```typescript
const customMaterial = {
  name: "Bamboo Plywood",
  thickness: 18,
  costPerMeter: 120,
  density: 0.7,
  color: "#88bb77",
};
```

## Available Features

### Core Features

- **3D Visualization**: Interactive 3D rendering of projects
- **Real-Time Editing**: Live dimension and parameter adjustments
- **Technical Drawings**: Automated technical drawing generation
- **Cutting Layouts**: Optimized cutting patterns for materials
- **Material List**: Detailed material specifications and costs
- **Exploded Views**: Step-by-step assembly visualization

### Joinery Types

- **Box Joints**: Strong interlocking joints for boxes and cabinets
- **Half-Lap Joints**: Simple, strong joints for frames and structures
- **Custom Joints**: Support for implementing project-specific joinery

### Project Types

- **Workbench**: Complete workbench with adjustable dimensions
- **Montessori Library**: Children's library with modular shelves
- **Enclosure**: Protective enclosure for equipment
- **Custom Projects**: Support for creating new project types

## Technical Specifications

### Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **3D Rendering**: Three.js
- **UI Components**: Custom React components with CSS
- **Language**: TypeScript
- **Package Manager**: npm

### Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### System Requirements

- Modern web browser with WebGL support
- Minimum 4GB RAM
- 2GHz processor
- Internet connection for initial loading

## Strengths and Weaknesses

### Strengths

1. **Extensibility**: Easy to create custom projects and piece types
2. **User-Friendly**: Intuitive interface with real-time feedback
3. **Precision**: Accurate dimension calculations and technical drawings
4. **Versatility**: Supports various joinery types and project configurations
5. **Open Source**: Full access to source code for customization

### Weaknesses

1. **Complexity**: Steeper learning curve for advanced customization
2. **Performance**: Large projects may impact rendering speed
3. **Browser Limitations**: Dependent on WebGL support
4. **Limited Joinery Types**: Currently supports basic joint types
5. **Mobile Support**: Not optimized for touch devices

## Improvement Recommendations

### Short-Term Improvements

1. **Performance Optimization**: Implement Level of Detail (LOD) for large projects
2. **Joinery Expansion**: Add support for dovetail and mortise-and-tenon joints
3. **Material Database**: Create a reusable material library
4. **Export Formats**: Add support for exporting to CAD formats (DXF, SVG)
5. **Documentation**: Improve API documentation and examples

### Medium-Term Improvements

1. **Mobile Optimization**: Create responsive design for tablet use
2. **Collaboration Features**: Add project sharing and version control
3. **Simulation Tools**: Implement stress and weight capacity calculations
4. **Customization UI**: Create visual interface for piece and joint customization
5. **Cost Estimation**: Improve material cost calculations with waste optimization

### Long-Term Improvements

1. **AR Visualization**: Augmented reality preview of projects
2. **Machine Integration**: Connect to CNC machines for automated cutting
3. **Material Simulation**: Realistic material texture and finish rendering
4. **AI Assistance**: Provide design suggestions based on user requirements
5. **Community Features**: Create project sharing platform and user forums

## Getting Started

To start exploring the project:

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open browser at `http://localhost:5173`
4. Select a project from the list to view and customize

## Contributing

Contributions are welcome! Please feel free to:

1. Submit bug reports and feature requests
2. Create pull requests for improvements
3. Share your custom projects and designs
4. Suggest enhancements to the documentation

## License

This project is open source and available under the MIT License.
