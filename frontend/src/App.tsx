import { useState } from 'react';
import RubiksCube from './components/RubiksCube';
import type { CubeSize, SolveResponse } from './types/cube';
import './App.css';

function App() {
  const [cubeSize, setCubeSize] = useState<CubeSize>(3);
  const [currentScramble, setCurrentScramble] = useState<string>('');
  const [solution, setSolution] = useState<SolveResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleScramble = (scramble: string) => {
    setCurrentScramble(scramble);
    setSolution(null);
  };

  const handleSolve = async () => {
    if (!currentScramble) return;
    
    setIsLoading(true);
    try {
      // TODO: Call backend API when ready
      const response = await fetch('http://localhost:5000/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          size: cubeSize,
          scramble: currentScramble
        })
      });
      
      if (response.ok) {
        const solveData: SolveResponse = await response.json();
        setSolution(solveData);
      } else {
        console.error('Failed to solve cube');
      }
    } catch (error) {
      console.error('Error solving cube:', error);
      // For now, show a mock solution
      setSolution({
        solution: "R U R' U' R U R' U'",
        length: 8,
        method: 'mock'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Rubik's Cube Solver</h1>
        <p>Interactive 3D Rubik's Cube with Custom Algorithm</p>
      </header>
      
      <main className="app-main">
        <div className="cube-size-selector">
          <label>Cube Size:</label>
          <select 
            value={cubeSize} 
            onChange={(e) => setCubeSize(Number(e.target.value) as CubeSize)}
          >
            <option value={3}>3×3×3</option>
            <option value={4}>4×4×4</option>
          </select>
        </div>
        
        <RubiksCube 
          size={cubeSize}
          onScramble={handleScramble}
          onSolve={handleSolve}
        />
        
        {isLoading && (
          <div className="loading">
            <p>Solving cube...</p>
          </div>
        )}
        
        {solution && (
          <div className="solution-display">
            <h3>Solution Found!</h3>
            <p><strong>Algorithm:</strong> {solution.solution}</p>
            <p><strong>Moves:</strong> {solution.length}</p>
            <p><strong>Method:</strong> {solution.method}</p>
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>Built for AeroHack 2024 • Custom Two-Phase Algorithm</p>
      </footer>
    </div>
  );
}

export default App;
