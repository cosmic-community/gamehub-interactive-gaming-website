'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { BreakoutBall, BreakoutPaddle, BreakoutBrick, GameState } from '@/types'

export default function Breakout({ onGameEnd }: { onGameEnd: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  
  // Game constants
  const CANVAS_WIDTH = 600
  const CANVAS_HEIGHT = 400
  const PADDLE_WIDTH = 100
  const PADDLE_HEIGHT = 20
  const BALL_SIZE = 8
  const BRICK_WIDTH = 60
  const BRICK_HEIGHT = 20
  const BRICK_ROWS = 5
  const BRICK_COLS = 10

  // Game objects
  const [ball, setBall] = useState<BreakoutBall>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 50,
    dx: 3,
    dy: -3
  })
  
  const [paddle, setPaddle] = useState<BreakoutPaddle>({
    x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    width: PADDLE_WIDTH
  })
  
  const [bricks, setBricks] = useState<BreakoutBrick[]>([])

  // Initialize bricks
  useEffect(() => {
    const initialBricks: BreakoutBrick[] = []
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']
    
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        initialBricks.push({
          x: col * (BRICK_WIDTH + 2) + 5,
          y: row * (BRICK_HEIGHT + 2) + 30,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          visible: true,
          color: colors[row] || colors[0] // Fix: provide fallback color
        })
      }
    }
    setBricks(initialBricks)
  }, [])

  // Game loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Update ball position
    setBall(prev => {
      const newBall = { ...prev }
      newBall.x += newBall.dx
      newBall.y += newBall.dy

      // Wall collisions
      if (newBall.x <= BALL_SIZE/2 || newBall.x >= CANVAS_WIDTH - BALL_SIZE/2) {
        newBall.dx = -newBall.dx
      }
      
      if (newBall.y <= BALL_SIZE/2) {
        newBall.dy = -newBall.dy
      }

      // Paddle collision
      if (
        newBall.y + BALL_SIZE/2 >= CANVAS_HEIGHT - PADDLE_HEIGHT - 10 &&
        newBall.x >= paddle.x &&
        newBall.x <= paddle.x + paddle.width
      ) {
        newBall.dy = -Math.abs(newBall.dy)
        
        // Add angle based on where ball hits paddle
        const relativeIntersectX = (newBall.x - (paddle.x + paddle.width/2)) / (paddle.width/2)
        newBall.dx = relativeIntersectX * 5
      }

      // Ball falls off screen
      if (newBall.y > CANVAS_HEIGHT) {
        setLives(prev => prev - 1)
        // Reset ball position
        newBall.x = CANVAS_WIDTH / 2
        newBall.y = CANVAS_HEIGHT - 50
        newBall.dx = 3
        newBall.dy = -3
      }

      return newBall
    })

    // Brick collisions
    setBricks(prev => {
      const newBricks = [...prev]
      let scoreIncrease = 0

      newBricks.forEach(brick => {
        if (
          brick.visible &&
          ball.x + BALL_SIZE/2 >= brick.x &&
          ball.x - BALL_SIZE/2 <= brick.x + brick.width &&
          ball.y + BALL_SIZE/2 >= brick.y &&
          ball.y - BALL_SIZE/2 <= brick.y + brick.height
        ) {
          brick.visible = false
          setBall(prev => ({ ...prev, dy: -prev.dy }))
          scoreIncrease += 10
        }
      })

      if (scoreIncrease > 0) {
        setScore(prev => prev + scoreIncrease)
      }

      return newBricks
    })

    // Draw ball
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, BALL_SIZE/2, 0, Math.PI * 2)
    ctx.fillStyle = '#ef4444'
    ctx.fill()

    // Draw paddle
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(paddle.x, CANVAS_HEIGHT - PADDLE_HEIGHT - 10, paddle.width, PADDLE_HEIGHT)

    // Draw bricks
    bricks.forEach(brick => {
      if (brick.visible) {
        ctx.fillStyle = brick.color
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
        ctx.strokeStyle = '#374151'
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height)
      }
    })

    // Check win condition
    const visibleBricks = bricks.filter(brick => brick.visible)
    if (visibleBricks.length === 0) {
      setGameState('gameOver')
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      onGameEnd(score)
      return
    }

    // Check lose condition
    if (lives <= 0) {
      setGameState('gameOver')
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      onGameEnd(score)
      return
    }

    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop)
    }
  }, [ball, paddle, bricks, gameState, score, lives, onGameEnd])

  // Start game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoop()
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, gameLoop])

  // Mouse movement for paddle
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || gameState !== 'playing') return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const newX = Math.max(0, Math.min(mouseX - PADDLE_WIDTH/2, CANVAS_WIDTH - PADDLE_WIDTH))
      
      setPaddle(prev => ({ ...prev, x: newX }))
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    return () => canvas.removeEventListener('mousemove', handleMouseMove)
  }, [gameState])

  // Touch controls for mobile
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || gameState !== 'playing') return

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      if (touch) {
        const touchX = touch.clientX - rect.left
        const newX = Math.max(0, Math.min(touchX - PADDLE_WIDTH/2, CANVAS_WIDTH - PADDLE_WIDTH))
        setPaddle(prev => ({ ...prev, x: newX }))
      }
    }

    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => canvas.removeEventListener('touchmove', handleTouchMove)
  }, [gameState])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setLives(3)
    
    // Reset game objects
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 50,
      dx: 3,
      dy: -3
    })
    
    setPaddle({
      x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
      width: PADDLE_WIDTH
    })

    // Reset bricks
    const initialBricks: BreakoutBrick[] = []
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']
    
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        initialBricks.push({
          x: col * (BRICK_WIDTH + 2) + 5,
          y: row * (BRICK_HEIGHT + 2) + 30,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          visible: true,
          color: colors[row] || colors[0]
        })
      }
    }
    setBricks(initialBricks)
  }

  const pauseGame = () => {
    setGameState('paused')
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const resumeGame = () => {
    setGameState('playing')
  }

  return (
    <div className="breakout-game space-y-4">
      {/* Game Stats */}
      <div className="flex justify-between items-center">
        <div className="score-display">
          Score: {score.toLocaleString()}
        </div>
        <div className="score-display">
          Lives: {'❤️'.repeat(lives)}
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="breakout-canvas"
        />
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

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>Move your mouse or touch to control the paddle</p>
        <p>Break all the bricks to win!</p>
      </div>
    </div>
  )
}