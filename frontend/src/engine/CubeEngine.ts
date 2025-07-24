import type { CubeSize, CubeletData, Position3D, Face, Move } from '../types/cube';
import { CUBE_COLORS } from '../types/cube';

export class CubeEngine {
  private size: CubeSize;
  private cubelets: CubeletData[];

  constructor(size: CubeSize = 3) {
    this.size = size;
    this.cubelets = this.initializeCube();
  }

  private initializeCube(): CubeletData[] {
    const cubelets: CubeletData[] = [];
    const half = (this.size - 1) / 2;

    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        for (let z = 0; z < this.size; z++) {
          // Skip the inner core pieces for odd cubes
          if (this.size % 2 === 1) {
            const centerX = Math.floor(this.size / 2);
            const centerY = Math.floor(this.size / 2);
            const centerZ = Math.floor(this.size / 2);
            if (x === centerX && y === centerY && z === centerZ) continue;
          }

          const position: Position3D = {
            x: x - half,
            y: y - half,
            z: z - half
          };

          const colors = this.getCubeletColors(x, y, z);
          const type = this.getCubeletType(x, y, z);

          cubelets.push({
            id: `${x}-${y}-${z}`,
            position,
            colors,
            type
          });
        }
      }
    }

    return cubelets;
  }

  private getCubeletColors(x: number, y: number, z: number): Record<Face, string | null> {
    const colors: Record<Face, string | null> = {
      U: null, D: null, L: null, R: null, F: null, B: null
    };

    // Only assign colors to faces that are on the exterior of the cube
    if (y === this.size - 1) colors.U = CUBE_COLORS.U; // Top face
    if (y === 0) colors.D = CUBE_COLORS.D; // Bottom face
    if (x === 0) colors.L = CUBE_COLORS.L; // Left face
    if (x === this.size - 1) colors.R = CUBE_COLORS.R; // Right face
    if (z === this.size - 1) colors.F = CUBE_COLORS.F; // Front face
    if (z === 0) colors.B = CUBE_COLORS.B; // Back face

    return colors;
  }

  private getCubeletType(x: number, y: number, z: number): 'corner' | 'edge' | 'center' | 'inner' {
    const isOnFace = (coord: number) => coord === 0 || coord === this.size - 1;
    const facesCount = [x, y, z].filter(isOnFace).length;

    if (facesCount === 3) return 'corner';
    if (facesCount === 2) return 'edge';
    if (facesCount === 1) return 'center';
    return 'inner';
  }

  public getCubelets(): CubeletData[] {
    return [...this.cubelets];
  }

  public getSize(): CubeSize {
    return this.size;
  }

  public scramble(moves: number = 20): string {
    const faces: Face[] = ['U', 'D', 'L', 'R', 'F', 'B'];
    const modifiers = ['', "'", '2'];
    const scrambleSequence: Move[] = [];

    for (let i = 0; i < moves; i++) {
      const face = faces[Math.floor(Math.random() * faces.length)];
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      const move = `${face}${modifier}` as Move;
      scrambleSequence.push(move);
      // Apply the move to actually scramble the cube
      this.applyMove(move);
    }

    return scrambleSequence.join(' ');
  }

  public applyMove(move: Move): void {
    console.log(`Applying move: ${move}`);
    
    const face = move[0] as Face;
    const modifier = move.slice(1);
    const clockwise = modifier !== "'";
    const double = modifier === '2';
    
    if (double) {
      this.rotateFace(face, clockwise);
      this.rotateFace(face, clockwise);
    } else {
      this.rotateFace(face, clockwise);
    }
  }

  private rotateFace(face: Face, clockwise: boolean): void {
    // Get all cubelets that belong to this face
    const facePositions = this.getFacePositions(face);
    const faceCubelets = this.cubelets.filter(cubelet => 
      facePositions.some(pos => 
        Math.abs(cubelet.position.x - pos.x) < 0.1 &&
        Math.abs(cubelet.position.y - pos.y) < 0.1 &&
        Math.abs(cubelet.position.z - pos.z) < 0.1
      )
    );

    // Rotate positions and colors
    faceCubelets.forEach(cubelet => {
      const newPosition = this.rotatePosition(cubelet.position, face, clockwise);
      const newColors = this.rotateColors(cubelet.colors, face, clockwise);
      
      cubelet.position = newPosition;
      cubelet.colors = newColors;
    });
  }

  private getFacePositions(face: Face): Position3D[] {
    const positions: Position3D[] = [];
    const half = (this.size - 1) / 2;
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        switch (face) {
          case 'U': // Top face (y = half)
            positions.push({ x: i - half, y: half, z: j - half });
            break;
          case 'D': // Bottom face (y = -half)
            positions.push({ x: i - half, y: -half, z: j - half });
            break;
          case 'F': // Front face (z = half)
            positions.push({ x: i - half, y: j - half, z: half });
            break;
          case 'B': // Back face (z = -half)
            positions.push({ x: i - half, y: j - half, z: -half });
            break;
          case 'R': // Right face (x = half)
            positions.push({ x: half, y: i - half, z: j - half });
            break;
          case 'L': // Left face (x = -half)
            positions.push({ x: -half, y: i - half, z: j - half });
            break;
        }
      }
    }
    
    return positions;
  }

  private rotatePosition(pos: Position3D, face: Face, clockwise: boolean): Position3D {
    const { x, y, z } = pos;
    const factor = clockwise ? 1 : -1;
    
    switch (face) {
      case 'U': // Rotate around Y-axis
        return { x: -z * factor, y, z: x * factor };
      case 'D': // Rotate around Y-axis (opposite direction)
        return { x: z * factor, y, z: -x * factor };
      case 'F': // Rotate around Z-axis
        return { x: y * factor, y: -x * factor, z };
      case 'B': // Rotate around Z-axis (opposite direction)
        return { x: -y * factor, y: x * factor, z };
      case 'R': // Rotate around X-axis
        return { x, y: z * factor, z: -y * factor };
      case 'L': // Rotate around X-axis (opposite direction)
        return { x, y: -z * factor, z: y * factor };
      default:
        return pos;
    }
  }

  private rotateColors(colors: Record<Face, string | null>, face: Face, clockwise: boolean): Record<Face, string | null> {
    const newColors = { ...colors };
    
    // Color rotation logic for each face
    switch (face) {
      case 'U':
        if (clockwise) {
          const temp = newColors.F;
          newColors.F = newColors.R;
          newColors.R = newColors.B;
          newColors.B = newColors.L;
          newColors.L = temp;
        } else {
          const temp = newColors.F;
          newColors.F = newColors.L;
          newColors.L = newColors.B;
          newColors.B = newColors.R;
          newColors.R = temp;
        }
        break;
      case 'D':
        if (clockwise) {
          const temp = newColors.F;
          newColors.F = newColors.L;
          newColors.L = newColors.B;
          newColors.B = newColors.R;
          newColors.R = temp;
        } else {
          const temp = newColors.F;
          newColors.F = newColors.R;
          newColors.R = newColors.B;
          newColors.B = newColors.L;
          newColors.L = temp;
        }
        break;
      // Add similar logic for other faces...
    }
    
    return newColors;
  }

  public isSolved(): boolean {
    // Check if all faces have uniform colors
    const faceColors: Record<Face, Set<string>> = {
      U: new Set(), D: new Set(), L: new Set(),
      R: new Set(), F: new Set(), B: new Set()
    };

    this.cubelets.forEach(cubelet => {
      Object.entries(cubelet.colors).forEach(([face, color]) => {
        if (color) {
          faceColors[face as Face].add(color);
        }
      });
    });

    // Each face should have exactly one color
    return Object.values(faceColors).every(colorSet => colorSet.size <= 1);
  }

  public reset(): void {
    this.cubelets = this.initializeCube();
  }
}
