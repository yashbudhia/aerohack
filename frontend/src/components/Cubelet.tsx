import React, { useRef } from 'react';
import { Group } from 'three';
import type { CubeletData, Face } from '../types/cube';

interface CubeletProps {
  data: CubeletData;
}

const Cubelet: React.FC<CubeletProps> = ({ data }) => {
  const groupRef = useRef<Group>(null);
  const cubeletSize = 0.98;
  const stickerSize = 0.85;
  const stickerDepth = 0.01;

  // Create the black plastic base
  const createBase = () => (
    <mesh>
      <boxGeometry args={[cubeletSize, cubeletSize, cubeletSize]} />
      <meshStandardMaterial 
        color="#1a1a1a" 
        metalness={0.1} 
        roughness={0.8}
      />
    </mesh>
  );

  // Create colored stickers for visible faces
  const createStickers = () => {
    const stickers: React.ReactElement[] = [];
    const faces: { face: Face; position: [number, number, number]; rotation: [number, number, number] }[] = [
      { face: 'F', position: [0, 0, cubeletSize/2 + stickerDepth/2], rotation: [0, 0, 0] },
      { face: 'B', position: [0, 0, -cubeletSize/2 - stickerDepth/2], rotation: [0, Math.PI, 0] },
      { face: 'R', position: [cubeletSize/2 + stickerDepth/2, 0, 0], rotation: [0, Math.PI/2, 0] },
      { face: 'L', position: [-cubeletSize/2 - stickerDepth/2, 0, 0], rotation: [0, -Math.PI/2, 0] },
      { face: 'U', position: [0, cubeletSize/2 + stickerDepth/2, 0], rotation: [-Math.PI/2, 0, 0] },
      { face: 'D', position: [0, -cubeletSize/2 - stickerDepth/2, 0], rotation: [Math.PI/2, 0, 0] },
    ];

    faces.forEach(({ face, position, rotation }) => {
      const color = data.colors[face];
      if (color) {
        stickers.push(
          <mesh key={face} position={position} rotation={rotation}>
            <boxGeometry args={[stickerSize, stickerSize, stickerDepth]} />
            <meshStandardMaterial 
              color={color}
              metalness={0.0}
              roughness={0.2}
              emissive={color}
              emissiveIntensity={0.05}
            />
          </mesh>
        );
      }
    });

    return stickers;
  };

  return (
    <group
      ref={groupRef}
      position={[data.position.x, data.position.y, data.position.z]}
    >
      {createBase()}
      {createStickers()}
    </group>
  );
};

export default Cubelet;
