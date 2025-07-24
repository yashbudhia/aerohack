// Core cube types and interfaces
export type CubeSize = 3 | 4;

export type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';
export type Move = `${Face}` | `${Face}'` | `${Face}2`;

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface CubeletData {
  id: string;
  position: Position3D;
  colors: Record<Face, string | null>; // null if face is internal
  type: 'corner' | 'edge' | 'center' | 'inner';
}

export interface CubeState {
  size: CubeSize;
  cubelets: CubeletData[];
  isAnimating: boolean;
}

export interface SolveResponse {
  solution: string;
  length: number;
  method: string;
}

// Standard cube colors - authentic and vibrant
export const CUBE_COLORS = {
  U: '#ffffff', // White (Up) - pure white
  D: '#ffed00', // Yellow (Down) - bright yellow
  L: '#ff5722', // Orange (Left) - vibrant orange
  R: '#f44336', // Red (Right) - bright red
  F: '#4caf50', // Green (Front) - vibrant green
  B: '#2196f3', // Blue (Back) - bright blue
} as const;

// Move parsing utilities
export const parseMoves = (moveString: string): Move[] => {
  return moveString.trim().split(/\s+/).filter(Boolean) as Move[];
};

export const invertMove = (move: Move): Move => {
  if (move.endsWith("'")) return move.slice(0, -1) as Move;
  if (move.endsWith('2')) return move;
  return `${move}'` as Move;
};
