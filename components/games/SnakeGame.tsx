'use client'

import { useState, useEffect, useCallback } from 'react'
import { submitScore } from '@/lib/cosmic'
import type { SnakeSegment, Food, Direction, GameState } from '@/types'

const BOARD_SIZE = 20
const INITIAL_SNAKE: SnakeSegment[] = [{ x: 10, y: 10 }]
const INITIAL_FOOD: Food = { x: 15, y: 15 }

export default function SnakeGame() {
  const [snake, setSnake] = useState<SnakeSegment[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Food>(INITIAL_FOOD)
  const [direction, setDirection] = useState<Direction>('right')
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [speed, setSpeed] = useState(200)
  const [playerName, setPlayerName] = useState('')
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('snake-high-score')
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore))
    }
  }, [])

  const generateFood = useCallback((snakeBody: SnakeSegment[]): Food => {
    let newFood: Food
    do {
      newFood = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE)
      }
    } while (snakeBody.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    
    return newFood
  }, [])

  const resetGame = () => {
    setSnake(INITIAL_SNAKE)
    setFood(INITIAL_FOOD)
    setDirection('right')
    setGameState('idle')
    setScore(0)
    setSpeed(200)
  }

  const startGame = () => {
    resetGame()
    setGameState('playing')
  }

  const pauseGame = () => {
    setGameState('paused')
  }

  const resumeGame = () => {
    setGameState('playing')
  }

  const gameOver = async () => {
    setGameState('gameOver')
    
    // Update high score
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('snake-high-score', score.toString())
      
      // Submit score if player name is provided
      if (playerName.trim() && !isSubmittingScore) {
        setIsSubmittingScore(true)
        try {
          await submitScore('snake', playerName.trim(), score)
        } catch (error) {
          console.error('Failed to submit score:', error)
        } finally {
          setIsSubmittingScore(false)
        }
      }
    }
  }

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return

    const gameLoop = setInterval(() => {
      setSnake(currentSnake => {
        const newSnake = [...currentSnake]
        const head = { ...newSnake[0] }

        // Move head based on direction
        switch (direction) {
          case 'up': head.y -= 1; break
          case 'down': head.y += 1; break
          case 'left': head.x -= 1; break
          case 'right': head.x += 1; break
        }

        // Check wall collision
        if (head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE) {
          gameOver()
          return currentSnake
        }

        // Check self collision
        if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          gameOver()
          return currentSnake
        }

        newSnake.unshift(head)

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          const newFood = generateFood(newSnake)
          setFood(newFood)
          setScore(prev => prev + 10)
          
          // Increase speed slightly
          setSpeed(prev => Math.max(100, prev - 2))
        } else {
          newSnake.pop()
        }

        return newSnake
      })
    }, speed)

    return () => clearInterval(gameLoop)
  }, [gameState, direction, food, speed, generateFood])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return

      const newDirection: Direction | null = (() => {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            return direction !== 'down' ? 'up' : null
          case 'ArrowDown':
          case 's':
          case 'S':
            return direction !== 'up' ? 'down' : null
          case 'ArrowLeft':
          case 'a':
          case 'A':
            return direction !== 'right' ? 'left' : null
          case 'ArrowRight':
          case 'd':
          case 'D':
            return direction !== 'left' ? 'right' : null
          default:
            return null
        }
      })()

      if (newDirection) {
        setDirection(newDirection)
      }

      // Pause/Resume
      if (e.code === 'Space') {
        e.preventDefault()
        if (gameState === 'playing') {
          pauseGame()
        } else if (gameState === 'paused') {
          resumeGame()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, direction])

  const renderBoard = () => {
    const board = []
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y
        const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y)
        const isFood = food.x === x && food.y === y
        
        let cellClass = 'snake-cell '
        if (isSnakeHead) cellClass += 'snake-head'
        else if (isSnakeBody) cellClass += 'snake-body'
        else if (isFood) cellClass += 'snake-food'
        else cellClass += 'bg-secondary/20'
        
        board.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
          />
        )
      }
    }
    return board
  }

  return (
    <div className="game-container space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Snake Game</h2>
        
        {/* Player Name Input */}
        <div className="max-w-sm mx-auto">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-center"
            maxLength={20}
          />
        </div>
      </div>

      {/* Score Display */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <div className="score-display text-center">
          <div className="text-2xl font-bold text-primary">{score}</div>
          <div className="text-xs text-muted-foreground">Score</div>
        </div>
        <div className="score-display text-center">
          <div className="text-2xl font-bold text-accent">{highScore}</div>
          <div className="text-xs text-muted-foreground">High Score</div>
        </div>
      </div>

      {/* Game Board */}
      <div className="max-w-md mx-auto">
        <div 
          className="grid gap-0 border border-border bg-muted/10 p-2"
          style={{ 
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            aspectRatio: '1'
          }}
        >
          {renderBoard()}
        </div>
      </div>

      {/* Controls Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Use arrow keys or WASD to move • Space to pause</p>
      </div>

      {/* Game Status */}
      <div className="text-center space-y-4">
        {gameState === 'idle' && (
          <div>
            <p className="text-muted-foreground mb-4">Ready to start?</p>
            <button onClick={startGame} className="game-button">
              🐍 Start Game
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div>
            <p className="text-lg mb-4">
              Length: <span className="font-bold text-accent">{snake.length}</span>
            </p>
            <button onClick={pauseGame} className="game-button-secondary">
              ⏸️ Pause
            </button>
          </div>
        )}

        {gameState === 'paused' && (
          <div>
            <p className="text-lg text-yellow-500 mb-4">Game Paused</p>
            <div className="flex gap-2 justify-center">
              <button onClick={resumeGame} className="game-button">
                ▶️ Resume
              </button>
              <button onClick={resetGame} className="game-button-secondary">
                🔄 Restart
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="space-y-4">
            <div className="text-xl font-bold text-destructive">Game Over!</div>
            <div className="text-lg">
              Final Length: <span className="font-bold text-accent">{snake.length}</span>
            </div>
            
            {score === highScore && score > 0 && (
              <div className="text-lg font-bold text-primary">🎉 New High Score!</div>
            )}
            
            {isSubmittingScore && (
              <p className="text-muted-foreground">Saving score...</p>
            )}
            
            <button onClick={startGame} className="game-button">
              🔄 Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}