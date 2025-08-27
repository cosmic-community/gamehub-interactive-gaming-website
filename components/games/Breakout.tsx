'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { GameState } from '@/types'
import { submitScore } from '@/lib/cosmic'

interface Ball {
  x: number
  y: number
  dx: number
  dy: number
}

interface Paddle {
  x: number
  width: number
}

interface Brick {
  x: number
  y: number
  width: number
  height: number
  visible: boolean
  color: string
}

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 400
const PADDLE_WIDTH = 80
const PADDLE_HEIGHT = 10
const BALL_SIZE = 8
const BRICK_ROWS = 6
const BRICK_COLS = 10
const BRICK_WIDTH = CANVAS_WIDTH / BRICK_COLS
const BRICK_HEIGHT = 20

export default function Breakout() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [playerName, setPlayerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  
  const [ball, setBall] = useState<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 50,
    dx: 3,
    dy: -3
  })
  
  const [paddle, setPaddle] = useState<Paddle>({
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    width: PADDLE_WIDTH
  })
  
  const [bricks, setBricks] = useState<Brick[]>([])
  const [keys, setKeys] = useState<Set<string>>(new Set())
  
  const gameLoopRef = useRef<number>()

  // Initialize bricks
  const initializeBricks = useCallback(() => {
    const newBricks: Brick[] = []
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']
    
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: col * BRICK_WIDTH,
          y: 50 + row * BRICK_HEIGHT,
          width: BRICK_WIDTH - 2,
          height: BRICK_HEIGHT - 2,
          visible: true,
          color: colors[row]
        })
      }
    }
    setBricks(newBricks)
  }, [])

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    setBall(currentBall => {
      let newBall = { ...currentBall }
      
      // Move ball
      newBall.x += newBall.dx
      newBall.y += newBall.dy
      
      // Ball collision with walls
      if (newBall.x <= 0 || newBall.x >= CANVAS_WIDTH - BALL_SIZE) {
        newBall.dx = -newBall.dx
      }
      if (newBall.y <= 0) {
        newBall.dy = -newBall.dy
      }
      
      // Ball collision with paddle
      if (
        newBall.y >= CANVAS_HEIGHT - 30 &&
        newBall.y <= CANVAS_HEIGHT - 20 &&
        newBall.x >= paddle.x &&
        newBall.x <= paddle.x + paddle.width
      ) {
        newBall.dy = -Math.abs(newBall.dy)
        // Add some angle based on where ball hits paddle
        const hitPos = (newBall.x - paddle.x) / paddle.width
        newBall.dx = 6 * (hitPos - 0.5)
      }
      
      // Ball falls off bottom
      if (newBall.y > CANVAS_HEIGHT) {
        setLives(prev => {
          const newLives = prev - 1
          if (newLives <= 0) {
            setGameState('gameOver')
            setShowNameInput(true)
          }
          return newLives
        })
        // Reset ball position
        newBall = {
          x: CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT - 50,
          dx: 3 * (Math.random() > 0.5 ? 1 : -1),
          dy: -3
        }
      }
      
      return newBall
    })

    // Check ball-brick collisions
    setBricks(currentBricks => {
      let brickHit = false
      const newBricks = currentBricks.map(brick => {
        if (!brick.visible) return brick
        
        if (
          ball.x < brick.x + brick.width &&
          ball.x + BALL_SIZE > brick.x &&
          ball.y < brick.y + brick.height &&
          ball.y + BALL_SIZE > brick.y
        ) {
          brickHit = true
          setScore(prev => prev + 10)
          return { ...brick, visible: false }
        }
        return brick
      })
      
      if (brickHit) {
        setBall(current => ({ ...current, dy: -current.dy }))
      }
      
      // Check if all bricks destroyed
      const visibleBricks = newBricks.filter(brick => brick.visible)
      if (visibleBricks.length === 0) {
        setLevel(prev => prev + 1)
        // Reset for next level with faster ball
        setTimeout(() => {
          initializeBricks()
          setBall({
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 50,
            dx: 4 + level,
            dy: -(4 + level)
          })
        }, 1000)
      }
      
      return newBricks
    })

    // Move paddle
    setPaddle(currentPaddle => {
      let newX = currentPaddle.x
      
      if (keys.has('ArrowLeft') || keys.has('KeyA')) {
        newX -= 8
      }
      if (keys.has('ArrowRight') || keys.has('KeyD')) {
        newX += 8
      }
      
      // Keep paddle in bounds
      newX = Math.max(0, Math.min(CANVAS_WIDTH - currentPaddle.width, newX))
      
      return { ...currentPaddle, x: newX }
    })

    // Draw everything
    // Draw bricks
    bricks.forEach(brick => {
      if (brick.visible) {
        ctx.fillStyle = brick.color
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
      }
    })
    
    // Draw paddle
    ctx.fillStyle = '#6366f1'
    ctx.fillRect(paddle.x, CANVAS_HEIGHT - 30, paddle.width, PADDLE_HEIGHT)
    
    // Draw ball
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, BALL_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()

  }, [gameState, ball, paddle, bricks, keys, level, initializeBricks])

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set(prev).add(e.code))
      
      if (e.code === 'Space') {
        e.preventDefault()
        if (gameState === 'playing') {
          setGameState('paused')
        } else if (gameState === 'paused') {
          setGameState('playing')
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev)
        newKeys.delete(e.code)
        return newKeys
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState])

  // Mouse control for paddle
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      if (gameState !== 'playing') return
      
      const rect = canvas.getBoundingClientRect()
      const scaleX = CANVAS_WIDTH / rect.width
      const mouseX = (e.clientX - rect.left) * scaleX
      
      setPaddle(prev => ({
        ...prev,
        x: Math.max(0, Math.min(CANVAS_WIDTH - prev.width, mouseX - prev.width / 2))
      }))
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    return () => canvas.removeEventListener('mousemove', handleMouseMove)
  }, [gameState])

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = window.setInterval(gameLoop, 16) // ~60 FPS
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
  }, [gameState, gameLoop])

  const startGame = () => {
    initializeBricks()
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 50,
      dx: 3,
      dy: -3
    })
    setPaddle({
      x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
      width: PADDLE_WIDTH
    })
    setScore(0)
    setLives(3)
    setLevel(1)
    setGameState('playing')
    setShowNameInput(false)
  }

  const resetGame = () => {
    setGameState('idle')
    setScore(0)
    setLives(3)
    setLevel(1)
    setShowNameInput(false)
  }

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerName.trim() || score === 0) return

    setIsSubmitting(true)
    try {
      await submitScore('breakout', playerName.trim(), score)
      setShowNameInput(false)
      resetGame()
    } catch (error) {
      console.error('Failed to submit score:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Game Info */}
      <div className="game-container">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="score-display">Score: {score}</div>
          <div className="score-display">Lives: {'❤️'.repeat(lives)}</div>
          <div className="score-display">Level: {level}</div>
        </div>

        <div className="text-center text-sm text-muted-foreground mb-4">
          <p><strong>Controls:</strong> Arrow Keys / A,D / Mouse Movement</p>
          <p>Press Space to pause • Break all bricks to advance!</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {gameState === 'idle' && (
            <button onClick={startGame} className="game-button">🎮 Start Game</button>
          )}
          {gameState === 'playing' && (
            <button onClick={() => setGameState('paused')} className="game-button-secondary">
              ⏸️ Pause
            </button>
          )}
          {gameState === 'paused' && (
            <button onClick={() => setGameState('playing')} className="game-button">
              ▶️ Resume
            </button>
          )}
          <button onClick={resetGame} className="game-button-secondary">🔄 Reset</button>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-border rounded mx-auto block bg-background"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">Ready for Breakout?</h3>
              <p className="text-muted-foreground">Break all the bricks to win!</p>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 rounded-lg">
            <div className="text-center space-y-4">
              <div className="text-4xl">💥</div>
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
      </div>

      {/* Score Submission */}
      {showNameInput && (
        <div className="game-container">
          <form onSubmit={handleScoreSubmit} className="space-y-4">
            <h3 className="text-xl font-bold text-center">🏆 Save Your Score!</h3>
            <p className="text-center text-muted-foreground">
              You scored {score} points! Enter your name to save it.
            </p>
            
            <div className="space-y-3">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-border rounded-md bg-background"
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
                >
                  Skip
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}