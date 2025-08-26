'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SnakeSegment, Food, Direction, GameState } from '@/types'

const GRID_SIZE = 20
const INITIAL_SNAKE: SnakeSegment[] = [{ x: 10, y: 10 }]
const INITIAL_FOOD: Food = { x: 15, y: 15 }
const GAME_SPEED = 150

export default function SnakeGame() {
  const [snake, setSnake] = useState<SnakeSegment[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Food>(INITIAL_FOOD)
  const [direction, setDirection] = useState<Direction>('right')
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('snake-high-score')
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore))
    }
  }, [])

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return

    const gameInterval = setInterval(() => {
      setSnake(currentSnake => {
        const newSnake = [...currentSnake]
        const head = newSnake[0]
        
        if (!head) return currentSnake // Safety check

        let newHead: SnakeSegment = { x: 0, y: 0 }

        // Calculate new head position based on direction
        switch (direction) {
          case 'up':
            newHead = { x: head.x, y: (head.y - 1 + GRID_SIZE) % GRID_SIZE }
            break
          case 'down':
            newHead = { x: head.x, y: (head.y + 1) % GRID_SIZE }
            break
          case 'left':
            newHead = { x: (head.x - 1 + GRID_SIZE) % GRID_SIZE, y: head.y }
            break
          case 'right':
            newHead = { x: (head.x + 1) % GRID_SIZE, y: head.y }
            break
        }

        // Check collision with self
        if (newSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameState('gameOver')
          return currentSnake
        }

        newSnake.unshift(newHead)

        // Check if food was eaten
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(prevScore => prevScore + 10)
          generateNewFood(newSnake)
        } else {
          newSnake.pop()
        }

        return newSnake
      })
    }, GAME_SPEED)

    return () => clearInterval(gameInterval)
  }, [gameState, direction, food])

  const generateNewFood = (currentSnake: SnakeSegment[]) => {
    let newFood: Food
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    
    setFood(newFood)
  }

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (gameState !== 'playing') return

    const keyMap: Record<string, Direction> = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'w': 'up',
      's': 'down',
      'a': 'left',
      'd': 'right'
    }

    const newDirection = keyMap[event.key]
    if (newDirection) {
      // Prevent reversing into self
      const opposites: Record<Direction, Direction> = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left'
      }

      if (opposites[newDirection] !== direction) {
        setDirection(newDirection)
      }
    }

    if (event.key === ' ') {
      event.preventDefault()
      setGameState(prev => prev === 'playing' ? 'paused' : 'playing')
    }
  }, [gameState, direction])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  useEffect(() => {
    if (gameState === 'gameOver' && score > highScore) {
      setHighScore(score)
      localStorage.setItem('snake-high-score', score.toString())
    }
  }, [gameState, score, highScore])

  const startGame = () => {
    setSnake(INITIAL_SNAKE)
    setFood(INITIAL_FOOD)
    setDirection('right')
    setScore(0)
    setGameState('playing')
  }

  const resetGame = () => {
    setSnake(INITIAL_SNAKE)
    setFood(INITIAL_FOOD)
    setDirection('right')
    setScore(0)
    setGameState('idle')
  }

  const getCellContent = (x: number, y: number): string => {
    // Check if it's the snake head
    if (snake[0] && snake[0].x === x && snake[0].y === y) {
      return 'head'
    }
    
    // Check if it's snake body
    if (snake.some(segment => segment.x === x && segment.y === y)) {
      return 'body'
    }
    
    // Check if it's food
    if (food.x === x && food.y === y) {
      return 'food'
    }
    
    return 'empty'
  }

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">🐍 Snake Game</h2>
        <p className="text-muted-foreground">
          Use arrow keys or WASD to move. Press space to pause.
        </p>
      </div>

      {/* Game Stats */}
      <div className="flex justify-center gap-6">
        <div className="score-display">
          <div className="text-sm text-muted-foreground">Score</div>
          <div className="text-xl font-bold">{score}</div>
        </div>
        
        <div className="score-display">
          <div className="text-sm text-muted-foreground">High Score</div>
          <div className="text-xl font-bold text-accent">{highScore}</div>
        </div>
        
        <div className="score-display">
          <div className="text-sm text-muted-foreground">Length</div>
          <div className="text-xl font-bold">{snake.length}</div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="flex justify-center">
        <div 
          className="inline-block p-4 bg-card border border-border rounded-lg"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gap: '1px',
            backgroundColor: 'hsl(var(--muted))'
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
            const x = index % GRID_SIZE
            const y = Math.floor(index / GRID_SIZE)
            const cellType = getCellContent(x, y)
            
            return (
              <div
                key={index}
                className={`snake-cell ${
                  cellType === 'head' ? 'snake-head' :
                  cellType === 'body' ? 'snake-body' :
                  cellType === 'food' ? 'snake-food' :
                  'bg-background'
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex justify-center gap-4">
        {gameState === 'idle' && (
          <button onClick={startGame} className="game-button">
            🎮 Start Game
          </button>
        )}
        
        {gameState === 'playing' && (
          <button onClick={() => setGameState('paused')} className="game-button">
            ⏸️ Pause
          </button>
        )}
        
        {gameState === 'paused' && (
          <button onClick={() => setGameState('playing')} className="game-button">
            ▶️ Resume
          </button>
        )}
        
        {(gameState === 'playing' || gameState === 'paused') && (
          <button onClick={resetGame} className="game-button-secondary">
            🔄 Reset
          </button>
        )}
      </div>

      {/* Game Over Screen */}
      {gameState === 'gameOver' && (
        <div className="text-center space-y-4 p-6 bg-destructive/10 border border-destructive rounded-lg">
          <div className="text-4xl">💀</div>
          <h3 className="text-2xl font-bold text-destructive">Game Over!</h3>
          <p className="text-muted-foreground">
            Final Score: <span className="font-bold">{score}</span>
          </p>
          {score === highScore && score > 0 && (
            <p className="text-accent font-bold">🎉 New High Score!</p>
          )}
          <div className="flex justify-center gap-4">
            <button onClick={startGame} className="game-button">
              🎮 Play Again
            </button>
            <button onClick={resetGame} className="game-button-secondary">
              🏠 Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* Pause Screen */}
      {gameState === 'paused' && (
        <div className="text-center space-y-4 p-6 bg-accent/10 border border-accent rounded-lg">
          <div className="text-4xl">⏸️</div>
          <h3 className="text-2xl font-bold text-accent">Game Paused</h3>
          <p className="text-muted-foreground">
            Press space or click Resume to continue
          </p>
        </div>
      )}
    </div>
  )
}