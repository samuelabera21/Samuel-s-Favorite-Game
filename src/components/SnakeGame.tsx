import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

const GRID_SIZE = 15;
// Decreased CELL_SIZE from 20 to 15 for thinner snake
const CELL_SIZE = 15;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SNAKE = [{ x: 7, y: 7 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const GAME_SPEED = 150; // Medium speed in milliseconds

const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Position>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Position>({ x: 10, y: 10 });
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const gameLoopRef = useRef<NodeJS.Timeout>();

  // Generate random food position
  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  // Check collision with walls or self
  const checkCollision = useCallback((head: Position, body: Position[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    // Self collision
    return body.some(segment => segment.x === head.x && segment.y === head.y);
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    if (!gameStarted || isPaused || gameOver) return;

    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };
      
      // Move head
      head.x += direction.x;
      head.y += direction.y;

      // Check collision
      if (checkCollision(head, newSnake)) {
        setGameOver(true);
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check if food is eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameStarted, isPaused, gameOver, checkCollision, generateFood]);

  // Handle keyboard input
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!gameStarted || isPaused || gameOver) return;

    switch (e.key) {
      case 'ArrowUp':
        if (direction.y === 0) setDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
        if (direction.y === 0) setDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
        if (direction.x === 0) setDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
        if (direction.x === 0) setDirection({ x: 1, y: 0 });
        break;
    }
  }, [direction, gameStarted, isPaused, gameOver]);

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw snake in green with reduced thickness
    ctx.fillStyle = '#00FF00';
    snake.forEach(segment => {
      ctx.fillRect(
        segment.x * CELL_SIZE,
        segment.y * CELL_SIZE,
        CELL_SIZE - 2, // Reduced thickness by adjusting width/height
        CELL_SIZE - 2  // Reduced thickness by adjusting width/height
      );
    });

    // Draw food in red with reduced thickness
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(
      food.x * CELL_SIZE,
      food.y * CELL_SIZE,
      CELL_SIZE - 2, // Reduced thickness to match snake
      CELL_SIZE - 2  // Reduced thickness to match snake
    );
  }, [snake, food]);

  // Start game
  const startGame = () => {
    setGameStarted(true);
    setIsPaused(false);
  };

  // Pause/Resume game
  const togglePause = () => {
    if (gameStarted && !gameOver) {
      setIsPaused(!isPaused);
    }
  };

  // Restart game
  const restartGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood({ x: 10, y: 10 });
    setGameOver(false);
    setGameStarted(false);
    setIsPaused(false);
    setScore(0);
  };

  // Set up game loop
  useEffect(() => {
    if (gameStarted && !isPaused && !gameOver) {
      gameLoopRef.current = setInterval(gameLoop, GAME_SPEED);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameLoop, gameStarted, isPaused, gameOver]);

  // Set up keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Draw game
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="bg-black p-6 rounded-lg border-2 border-gray-600">
        <h1 className="text-2xl font-bold text-green-400 text-center mb-4 font-mono">
          Samuel's Favorite Game
        </h1>
        
        <div className="mb-4 text-center">
          <div className="text-green-400 font-mono text-lg">
            Score: {score}
          </div>
          <div className="text-gray-400 font-mono text-sm mt-1">
            Created by Samuel - 2025
          </div> {/* Added creator note */}
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="border border-gray-600 bg-black"
          />
          
          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-green-400 font-mono text-xl mb-2">Samuel's Favorite Game</div>
                <div className="text-red-400 font-mono text-xl mb-2">GAME OVER</div>
                <div className="text-green-400 font-mono text-lg mb-2">Final Score: {score}</div>
                <div className="text-gray-400 font-mono text-sm">
                  Created by Samuel - 2025
                </div> {/* Added creator note on game over */}
              </div>
            </div>
          )}
          
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-green-400 font-mono text-lg mb-4">Press START to begin</div>
                <div className="text-gray-400 font-mono text-sm">Use arrow keys to control</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-center gap-2">
          {!gameStarted && !gameOver && (
            <button
              onClick={startGame}
              className="px-4 py-2 bg-green-600 text-black font-mono font-bold rounded hover:bg-green-500 transition-colors"
            >
              START
            </button>
          )}
          
          {gameStarted && !gameOver && (
            <button
              onClick={togglePause}
              className="px-4 py-2 bg-yellow-600 text-black font-mono font-bold rounded hover:bg-yellow-500 transition-colors"
            >
              {isPaused ? 'RESUME' : 'PAUSE'}
            </button>
          )}
          
          {gameOver && (
            <button
              onClick={restartGame}
              className="px-4 py-2 bg-blue-600 text-white font-mono font-bold rounded hover:bg-blue-500 transition-colors"
            >
              RESTART
            </button>
          )}
        </div>

        <div className="mt-4 text-center text-gray-400 font-mono text-xs">
          Use ↑ ↓ ← → arrow keys to control the snake
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;