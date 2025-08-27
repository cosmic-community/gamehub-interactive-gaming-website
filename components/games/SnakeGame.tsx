'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { SnakeSegment, Food, Direction, GameState } from '@/types'

export default function SnakeGame({ onGameEnd }: { onGameEnd: (score: number) => void }) {
  const [snake, setSnake] = useState<SnakeSegment[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Food>({ x: 15, y: 15 })
  const [direction, setDirection] = useState<Direction>('right')
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [speed, setSpeed] = useState(200)
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const gridSize = 20
  const canvasSize = 400

  // Generate random food position
  const generateFood = useCallback((currentSnake: SnakeSegment[]): Food => {
    let newFood: Food
    do {
      newFood = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize)
      }
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    
    return newFood
  }, [])

  // Move snake
  const moveSnake = useCallback(() => {
    setSnake(currentSnake => {
      if (currentSnake.length === 0) return currentSnake
      
      const head = currentSnake[0]
      if (!head) return currentSnake // Fix: Check if head exists
      
      let newHead: SnakeSegment = { x: head.x, y: head.y }

      // Move based on direction
      switch (direction) {
        case 'up':
          newHead.y = head.y !== undefined ? head.y - 1 : 0 // Fix: Handle undefined
          break
        case 'down':
          newHead.y = head.y !== undefined ? head.y + 1 : 0 // Fix: Handle undefined
          break
        case 'left':
          newHead.x = head.x !== undefined ? head.x - 1 : 0 // Fix: Handle undefined
          break
        case 'right':
          newHead.x = head.x !== undefined ? head.x + 1 : 0 // Fix: Handle undefined
          break
      }

      // Check wall collision
      if (newHead.x < 0 || newHead.x >= gridSize || newHead.y < 0 || newHead.y >= gridSize) {
        setGameState('gameOver')
        return currentSnake
      }

      // Check self collision
      if (currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameState('gameOver')
        return currentSnake
      }

      const newSnake = [newHead, ...currentSnake]

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(prev => prev + 10)
        setFood(generateFood(newSnake)) // Fix: Pass valid SnakeSegment array
        setSpeed(prev => Math.max(100, prev - 5)) // Increase speed
        return newSnake
      } else {
        return newSnake.slice(0, -1) // Remove tail if no food eaten
      }
    })
  }, [direction, food, generateFood])

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(moveSnake, speed)
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameState, moveSnake, speed])

  // Handle game over
  useEffect(() => {
    if (gameState === 'gameOver') {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
        gameLoopRef.current = null
      }
      onGameEnd(score)
    }
  }, [gameState, score, onGameEnd])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setDirection(current => current !== 'down' ? 'up' : current)
          break
        case 'ArrowDown':
          e.preventDefault()
          setDirection(current => current !== 'up' ? 'down' : current)
          break
        case 'ArrowLeft':
          e.preventDefault()
          setDirection(current => current !== 'right' ? 'left' : current)
          break
        case 'ArrowRight':
          e.preventDefault()
          setDirection(current => current !== 'left' ? 'right' : current)
          break
        case ' ':
          e.preventDefault()
          if (gameState === 'playing') {
            setGameState('paused')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState])

  // Touch controls for mobile
  useEffect(() => {
    let startX = 0
    let startY = 0

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) {
        startX = touch.clientX
        startY = touch.clientY
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (gameState !== 'playing') return
      
      const touch = e.changedTouches[0]
      if (!touch) return

      const deltaX = touch.clientX - startX
      const deltaY = touch.clientY - startY
      const minSwipeDistance = 30

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          const newDirection = deltaX > 0 ? 'right' : 'left'
          setDirection(current => 
            (newDirection === 'right' && current !== 'left') || 
            (newDirection === 'left' && current !== 'right') 
              ? newDirection 
              : current
          )
        }
      } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
          const newDirection = deltaY > 0 ? 'down' : 'up'
          setDirection(current => 
            (newDirection === 'down' && current !== 'up') || 
            (newDirection === 'up' && current !== 'down') 
              ? newDirection 
              : current
          )
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [gameState])

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }])
    setFood({ x: 15, y: 15 })
    setDirection('right')
    setScore(0)
    setSpeed(200)
    setGameState('playing')
  }

  const pauseGame = () => {
    setGameState('paused')
  }

  const resumeGame = () => {
    setGameState('playing')
  }

  const cellSize = canvasSize / gridSize

  return (
    <div className="snake-game space-y-6">
      {/* Game Stats */}
      <div className="flex justify-between items-center">
        <div className="score-display">
          Score: {score.toLocaleString()}
        </div>
        <div className="score-display">
          Speed: {Math.round((300 - speed) / 10)}
        </div>
      </div>

      {/* Game Board */}
      <div className="flex justify-center">
        <div 
          className="relative bg-card border-2 border-border rounded-lg"
          style={{ width: canvasSize, height: canvasSize }}
        >
          {/* Grid */}
          <div className="absolute inset-0 grid grid-cols-20 grid-rows-20 gap-0">
            {Array.from({ length: gridSize * gridSize }, (_, index) => {
              const x = index % gridSize
              const y = Math.floor(index / gridSize)
              
              const isSnake = snake.some(segment => segment.x === x && segment.y === y)
              const isHead = snake[0]?.x === x && snake[0]?.y === y
              const isFood = food.x === x && food.y === y
              
              let className = 'snake-cell'
              if (isFood) {
                className += ' snake-food'
              } else if (isHead) {
                className += ' snake-head'
              } else if (isSnake) {
                className += ' snake-body'
              }
              
              return (
                <div
                  key={index}
                  className={className}
                />
              )
            })}
          </div>
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
          <button onClick={pauseGame} className="game-button-secondary">
            ⏸️ Pause
          </button>
        )}
        
        {gameState === 'paused' && (
          <>
            <button onClick={resumeGame} className="game-button">
              ▶️ Resume
            </button>
            <button onClick={startGame} className="game-button-secondary">
              🔄 Restart
            </button>
          </>
        )}
        
        {gameState === 'gameOver' && (
          <button onClick={startGame} className="game-button">
            🔄 Play Again
          </button>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="grid grid-cols-3 gap-2 max-w-48 mx-auto md:hidden">
        <div></div>
        <button
          onClick={() => setDirection(current => current !== 'down' ? 'up' : current)}
          disabled={gameState !== 'playing'}
          className="game-button text-2xl p-2"
        >
          ⬆️
        </button>
        <div></div>
        
        <button
          onClick={() => setDirection(current => current !== 'right' ? 'left' : current)}
          disabled={gameState !== 'playing'}
          className="game-button text-2xl p-2"
        >
          ⬅️
        </button>
        <button
          onClick={gameState === 'playing' ? pauseGame : resumeGame}
          disabled={gameState === 'idle' || gameState === 'gameOver'} // Fix: Correct state comparison
          className="game-button-secondary text-xl p-2"
        >
          {gameState === 'playing' ? '⏸️' : '▶️'}
        </button>
        <button
          onClick={() => setDirection(current => current !== 'left' ? 'right' : current)}
          disabled={gameState !== 'playing'}
          className="game-button text-2xl p-2"
        >
          ➡️
        </button>
        
        <div></div>
        <button
          onClick={() => setDirection(current => current !== 'up' ? 'down' : current)}
          disabled={gameState !== 'playing'}
          className="game-button text-2xl p-2"
        >
          ⬇️
        </button>
        <div></div>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>Use arrow keys, swipe, or mobile controls to move</p>
        <p>Eat the red food to grow and increase your score!</p>
        <p>Press spacebar to pause</p>
      </div>
    </div>
  )
}