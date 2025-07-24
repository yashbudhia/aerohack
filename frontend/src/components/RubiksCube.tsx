import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Group } from 'three';
import gsap from 'gsap';
import { CubeEngine } from '../engine/CubeEngine';
import type { CubeSize, CubeletData, Move } from '../types/cube';
import { parseMoves } from '../types/cube';
import Cubelet from './Cubelet';

interface RubiksCubeProps {
  size: CubeSize;
  onScramble?: (scramble: string) => void;
  onSolve?: () => void;
}

const RubiksCube: React.FC<RubiksCubeProps> = ({ size, onScramble, onSolve }) => {
  const [cubeEngine] = useState(() => new CubeEngine(size));
  const [cubelets, setCubelets] = useState<CubeletData[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scrambleSequence, setScrambleSequence] = useState<string>('');
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    // Initialize with animated scramble
    const initializeScramble = async () => {
      // Start with solved cube
      setCubelets(cubeEngine.getCubelets());
      
      // Wait a moment then animate scramble
      setTimeout(async () => {
        setIsAnimating(true);
        
        // Generate and animate scramble
        cubeEngine.reset(); // Ensure we start from solved
        const scrambleMoves = [];
        const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
        const modifiers = ['', "'", '2'];
        
        // Generate 20 moves
        for (let i = 0; i < 20; i++) {
          const face = faces[Math.floor(Math.random() * faces.length)];
          const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
          const move = `${face}${modifier}`;
          scrambleMoves.push(move);
        }
        
        const scrambleString = scrambleMoves.join(' ');
        setScrambleSequence(scrambleString);
        
        // Animate the scramble
        await animateSequence(scrambleMoves as Move[]);
        
        setIsAnimating(false);
      }, 1000);
    };
    
    initializeScramble();
  }, [cubeEngine]);

  const animateSequence = async (moves: Move[]) => {
    for (const move of moves) {
      await animateMove(move);
      await new Promise(resolve => setTimeout(resolve, 150)); // Small delay between moves
    }
  };

  const animateMove = (move: Move): Promise<void> => {
    return new Promise((resolve) => {
      // Apply the move to the engine
      cubeEngine.applyMove(move);
      
      // Update the visual state
      setCubelets([...cubeEngine.getCubelets()]);
      
      // Add rotation animation to the group
      if (groupRef.current) {
        // Create a subtle shake effect for the entire cube during moves
        const currentRotation = {
          x: groupRef.current.rotation.x,
          y: groupRef.current.rotation.y,
          z: groupRef.current.rotation.z
        };
        
        // Add a subtle wiggle to show movement
        gsap.to(groupRef.current.rotation, {
          duration: 0.1,
          x: currentRotation.x + (Math.random() - 0.5) * 0.05,
          y: currentRotation.y + (Math.random() - 0.5) * 0.05,
          z: currentRotation.z + (Math.random() - 0.5) * 0.05,
          ease: "power2.inOut",
          yoyo: true,
          repeat: 1,
          onComplete: resolve
        });
        
        // Add a subtle bounce effect
        gsap.to(groupRef.current.scale, {
          duration: 0.15,
          scale: 1.02,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut"
        });
      } else {
        setTimeout(resolve, 300);
      }
    });
  };

  const handleScramble = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Reset cube first
    cubeEngine.reset();
    setCubelets(cubeEngine.getCubelets());
    
    // Generate scramble sequence
    const scramble = cubeEngine.scramble(20);
    setScrambleSequence(scramble);
    
    // Animate each move
    const moves = parseMoves(scramble);
    await animateSequence(moves);
    
    setIsAnimating(false);
    onScramble?.(scramble);
  };

  const handleSolve = () => {
    if (isAnimating) return;
    onSolve?.();
  };

  const handleReset = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Animate reset with a smooth transition
    if (groupRef.current) {
      gsap.to(groupRef.current.rotation, {
        duration: 0.5,
        x: 0,
        y: 0,
        z: 0,
        ease: "power2.inOut"
      });
      
      gsap.to(groupRef.current.scale, {
        duration: 0.3,
        scale: 0.8,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
        onComplete: () => {
          cubeEngine.reset();
          setCubelets(cubeEngine.getCubelets());
          setScrambleSequence('');
          setIsAnimating(false);
        }
      });
    } else {
      cubeEngine.reset();
      setCubelets(cubeEngine.getCubelets());
      setScrambleSequence('');
      setIsAnimating(false);
    }
  };

  return (
    <div className="rubiks-cube-container">
      <div className="cube-canvas">
        <Canvas
          camera={{ position: [8, 8, 8], fov: 40 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
          <directionalLight position={[-5, 5, 2]} intensity={0.8} />
          <pointLight position={[0, 10, 0]} intensity={0.5} />
          <spotLight position={[5, 5, 5]} intensity={0.8} angle={0.3} penumbra={0.5} />
          
          <group ref={groupRef}>
            {cubelets.map((cubelet) => (
              <Cubelet
                key={cubelet.id}
                data={cubelet}
              />
            ))}
          </group>
          
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={15}
          />
          
          <Environment preset="studio" />
        </Canvas>
      </div>
      
      <div className="cube-controls">
        <div className="control-buttons">
          <button 
            onClick={handleScramble}
            disabled={isAnimating}
            className="btn btn-scramble"
          >
            Scramble
          </button>
          <button 
            onClick={handleSolve}
            disabled={isAnimating || !scrambleSequence}
            className="btn btn-solve"
          >
            Solve
          </button>
          <button 
            onClick={handleReset}
            disabled={isAnimating}
            className="btn btn-reset"
          >
            Reset
          </button>
        </div>
        
        {isAnimating && (
          <div className="loading">
            <p>🎲 Animating moves...</p>
          </div>
        )}
        
        {scrambleSequence && !isAnimating && (
          <div className="scramble-display">
            <h4>Current Scramble:</h4>
            <p className="scramble-sequence">{scrambleSequence}</p>
          </div>
        )}
        
        <div className="cube-info">
          <p>Cube Size: {size}×{size}×{size}</p>
          <p>Status: {cubeEngine.isSolved() ? 'Solved' : 'Scrambled'}</p>
        </div>
      </div>
    </div>
  );
};

export default RubiksCube;
