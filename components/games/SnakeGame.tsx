'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { SnakeSegment, Food, Direction, GameState } from '@/types'
import { submitScore } from '@/lib/cosmic'

const GRID_SIZE = 20
const INITIAL_SNAKE: SnakeSegment[] = [{ x: 10, y: 10 }]
const INITIAL_FOOD: Food = { x: 15, y: 15 }
const INITIAL_DIRECTION: Direction = 'right'

export default function SnakeGame() {
  const [snake, setSnake] = useState<SnakeSegment[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Food>(INITIAL_FOOD)
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [gameSpeed, setGameSpeed] = useState(200)
  const [playerName, setPlayerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  
  const gameLoopRef = useRef<NodeJS.Timeout>()
  const directionRef = useRef<Direction>(INITIAL_DIRECTION)
  const gameContainerRef = useRef<HTMLDivElement>(null)

  // Generate random food position
  const generateFood = useCallback((): Food => {
    let newFood: Food
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [snake])

  // Check collision with walls or self
  const checkCollision = useCallback((head: SnakeSegment, snakeBody: SnakeSegment[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true
    }
    // Self collision
    return snakeBody.some(segment => segment.x === head.x && segment.y === head.y)
  }, [])

  // Game loop
  const gameLoop = useCallback(() => {
    setSnake(currentSnake => {
      const newSnake = [...currentSnake]
      const head = { ...newSnake[0] }

      // Move head based on direction
      switch (directionRef.current) {
        case 'up':
          head.y -= 1
          break
        case 'down':
          head.y += 1
          break
        case 'left':
          head.x -= 1
          break
        case 'right':
          head.x += 1
          break
      }

      // Check collision
      if (checkCollision(head, newSnake)) {
        setGameState('gameOver')
        setShowNameInput(true)
        return currentSnake
      }

      newSnake.unshift(head)

      // Check if food eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10)
        setFood(generateFood())
        // Increase speed slightly
        setGameSpeed(prev => Math.max(100, prev - 5))
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [food, generateFood, checkCollision])

  // Enhanced keyboard handling for ChromeOS compatibility
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return
    
    // Prevent default behavior for arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault()
    }

    let newDirection: Direction | null = null

    // Handle both arrow keys and WASD keys for better compatibility
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        if (directionRef.current !== 'down') newDirection = 'up'
        break
      case 'ArrowDown':
      case 'KeyS':
        if (directionRef.current !== 'up') newDirection = 'down'
        break
      case 'ArrowLeft':
      case 'KeyA':
        if (directionRef.current !== 'right') newDirection = 'left'
        break
      case 'ArrowRight':
      case 'KeyD':
        if (directionRef.current !== 'left') newDirection = 'right'
        break
      case 'Space':
        e.preventDefault()
        togglePause()
        break
    }

    if (newDirection) {
      directionRef.current = newDirection
      setDirection(newDirection)
    }
  }, [gameState])

  // Touch handling for mobile and ChromeOS touch devices
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (gameState !== 'playing') return
    
    const touch = e.touches[0]
    if (!touch) return
    
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY
    })
  }, [gameState])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (gameState !== 'playing' || !touchStart) return
    
    const touch = e.changedTouches[0]
    if (!touch) return

    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    const minSwipeDistance = 50

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && directionRef.current !== 'left') {
          directionRef.current = 'right'
          setDirection('right')
        } else if (deltaX < 0 && directionRef.current !== 'right') {
          directionRef.current = 'left'
          setDirection('left')
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0 && directionRef.current !== 'up') {
          directionRef.current = 'down'
          setDirection('down')
        } else if (deltaY < 0 && directionRef.current !== 'down') {
          directionRef.current = 'up'
          setDirection('up')
        }
      }
    }

    setTouchStart(null)
  }, [gameState, touchStart])

  // Enhanced event listeners setup
  useEffect(() => {
    const container = gameContainerRef.current
    if (!container) return

    // Multiple event listener strategies for ChromeOS compatibility
    const handleKeyDown = (e: KeyboardEvent) => handleKeyPress(e)
    const handleKeyUp = (e: KeyboardEvent) => handleKeyPress(e)
    
    // Add event listeners to document and container
    document.addEventListener('keydown', handleKeyDown, { passive: false })
    document.addEventListener('keyup', handleKeyUp, { passive: false })
    container.addEventListener('keydown', handleKeyDown, { passive: false })
    container.addEventListener('keyup', handleKeyUp, { passive: false })
    
    // Touch events for swipe controls
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    
    // Focus the container to ensure it can receive keyboard events
    container.setAttribute('tabindex', '0')
    container.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      container.removeEventListener('keydown', handleKeyDown)
      container.removeEventListener('keyup', handleKeyUp)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleKeyPress, handleTouchStart, handleTouchEnd])

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(gameLoop, gameSpeed)
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameState, gameSpeed, gameLoop])

  const startGame = () => {
    setSnake(INITIAL_SNAKE)
    setFood(INITIAL_FOOD)
    setDirection(INITIAL_DIRECTION)
    directionRef.current = INITIAL_DIRECTION
    setScore(0)
    setGameSpeed(200)
    setGameState('playing')
    setShowNameInput(false)
    
    // Focus container for keyboard events
    if (gameContainerRef.current) {
      gameContainerRef.current.focus()
    }
  }

  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused')
    } else if (gameState === 'paused') {
      setGameState('playing')
      if (gameContainerRef.current) {
        gameContainerRef.current.focus()
      }
    }
  }

  const resetGame = () => {
    setGameState('idle')
    setSnake(INITIAL_SNAKE)
    setFood(INITIAL_FOOD)
    setDirection(INITIAL_DIRECTION)
    directionRef.current = INITIAL_DIRECTION
    setScore(0)
    setGameSpeed(200)
    setShowNameInput(false)
  }

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerName.trim() || score === 0) return

    setIsSubmitting(true)
    try {
      await submitScore('snake', playerName.trim(), score)
      setShowNameInput(false)
      resetGame()
    } catch (error) {
      console.error('Failed to submit score:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDirectionButton = (newDirection: Direction) => {
    if (gameState !== 'playing') return
    
    // Prevent opposite direction
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up', 
      left: 'right',
      right: 'left'
    }
    
    if (directionRef.current !== opposites[newDirection]) {
      directionRef.current = newDirection
      setDirection(newDirection)
    }
  }

  return (
    <div className="space-y-6">
      {/* Game Info */}
      <div className="game-container">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="score-display">
            Score: {score}
          </div>
          <div className="score-display">
            Length: {snake.length}
          </div>
          <div className="score-display">
            Speed: {Math.round(300 - gameSpeed)}
          </div>
        </div>

        {/* Control Instructions */}
        <div className="text-center text-sm text-muted-foreground mb-4">
          <p className="mb-2">
            <strong>Controls:</strong> Arrow Keys / WASD / Touch Swipe / Direction Buttons
          </p>
          <p>Press Space to pause • Eat food to grow and increase speed!</p>
        </div>

        {/* Game Controls */}
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          {gameState === 'idle' && (
            <button onClick={startGame} className="game-button">
              🎮 Start Game
            </button>
          )}
          
          {gameState === 'playing' && (
            <>
              <button onClick={togglePause} className="game-button-secondary">
                ⏸️ Pause
              </button>
              <button onClick={resetGame} className="game-button-secondary">
                🔄 Reset
              </button>
            </>
          )}
          
          {gameState === 'paused' && (
            <>
              <button onClick={togglePause} className="game-button">
                ▶️ Resume
              </button>
              <button onClick={resetGame} className="game-button-secondary">
                🔄 Reset
              </button>
            </>
          )}
          
          {gameState === 'gameOver' && !showNameInput && (
            <button onClick={startGame} className="game-button">
              🎮 Play Again
            </button>
          )}
        </div>
      </div>

      {/* Game Board */}
      <div 
        ref={gameContainerRef}
        className="game-container focus:outline-none focus:ring-2 focus:ring-primary"
        tabIndex={0}
        style={{ 
          touchAction: 'none',  // Prevent default touch behaviors
          userSelect: 'none'    // Prevent text selection
        }}
      >
        {/* Game Status */}
        {gameState === 'idle' && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🐍</div>
            <h3 className="text-xl font-bold mb-2">Ready to Play Snake?</h3>
            <p className="text-muted-foreground">Click Start Game to begin!</p>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-4">⏸️</div>
              <h3 className="text-xl font-bold">Game Paused</h3>
              <p className="text-muted-foreground">Press Resume to continue</p>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="absolute inset-0 bg-background/90 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center space-y-4">
              <div className="text-4xl">💀</div>
              <h3 className="text-xl font-bold">Game Over!</h3>
              <p className="text-muted-foreground">Final Score: {score}</p>
              
              {!showNameInput && score > 0 && (
                <button 
                  onClick={() => setShowNameInput(true)}
                  className="game-button"
                >
                  🏆 Save High Score
                </button>
              )}
            </div>
          </div>
        )}

        {/* Snake Game Grid */}
        {(gameState === 'playing' || gameState === 'paused') && (
          <div className="relative mx-auto" style={{ width: 'fit-content' }}>
            <div 
              className="grid border-2 border-border rounded bg-muted/20"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                width: `${GRID_SIZE * 16}px`,
                height: `${GRID_SIZE * 16}px`
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                const x = index % GRID_SIZE
                const y = Math.floor(index / GRID_SIZE)
                
                const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y
                const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y)
                const isFood = food.x === x && food.y === y
                
                let cellClass = 'snake-cell'
                if (isSnakeHead) cellClass += ' snake-head'
                else if (isSnakeBody) cellClass += ' snake-body'
                else if (isFood) cellClass += ' snake-food'
                
                return (
                  <div
                    key={index}
                    className={cellClass}
                  />
                )
              })}
            </div>

            {/* Touch Control Buttons for ChromeOS */}
            <div className="mt-6 grid grid-cols-3 gap-2 max-w-48 mx-auto">
              <div></div>
              <button 
                onClick={() => handleDirectionButton('up')}
                className="game-button-secondary p-3 text-2xl"
                disabled={gameState !== 'playing'}
              >
                ⬆️
              </button>
              <div></div>
              
              <button 
                onClick={() => handleDirectionButton('left')}
                className="game-button-secondary p-3 text-2xl"
                disabled={gameState !== 'playing'}
              >
                ⬅️
              </button>
              <button 
                onClick={togglePause}
                className="game-button-secondary p-3 text-xl"
                disabled={gameState === 'idle' || gameState === 'gameOver'}
              >
                {gameState === 'playing' ? '⏸️' : '▶️'}
              </button>
              <button 
                onClick={() => handleDirectionButton('right')}
                className="game-button-secondary p-3 text-2xl"
                disabled={gameState !== 'playing'}
              >
                ➡️
              </button>
              
              <div></div>
              <button 
                onClick={() => handleDirectionButton('down')}
                className="game-button-secondary p-3 text-2xl"
                disabled={gameState !== 'playing'}
              >
                ⬇️
              </button>
              <div></div>
            </div>
          </div>
        )}
      </div>

      {/* Score Submission Form */}
      {showNameInput && (
        <div className="game-container">
          <form onSubmit={handleScoreSubmit} className="space-y-4">
            <h3 className="text-xl font-bold text-center">🏆 Save Your Score!</h3>
            <p className="text-center text-muted-foreground">
              You scored {score} points! Enter your name to save it to the leaderboard.
            </p>
            
            <div className="space-y-3">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={20}
                required
                autoFocus
              />
              
              <div className="flex gap-3">
                <button 
                  type="submit" 
                  disabled={!playerName.trim() || isSubmitting}
                  className="game-button flex-1 disabled:opacity-50"
                >
                  {isSubmitting ? '💾 Saving...' : '💾 Save Score'}
                </button>
                
                <button 
                  type="button"
                  onClick={() => setShowNameInput(false)}
                  className="game-button-secondary"
                  disabled={isSubmitting}
                >
                  Skip
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Game Tips */}
      <div className="game-container">
        <h3 className="text-lg font-bold mb-3">🎯 Game Tips</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Use arrow keys, WASD, or touch swipes to control the snake</li>
          <li>• Eat the red food to grow longer and increase your score</li>
          <li>• The game gets faster as you score more points</li>
          <li>• Don't hit the walls or your own tail</li>
          <li>• Press Space to pause/unpause the game</li>
          <li>• On ChromeOS: Use on-screen direction buttons if keyboard doesn't respond</li>
        </ul>
      </div>
    </div>
  )
}