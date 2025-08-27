'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { BreakoutBall, BreakoutPaddle, BreakoutBrick, GameState } from '@/types'

interface BreakoutProps {
  onGameEnd: (score: number) => void
}

export default function Breakout({ onGameEnd }: BreakoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  
  const CANVAS_WIDTH = 480
  const CANVAS_HEIGHT = 320
  const PADDLE_WIDTH = 75
  const PADDLE_HEIGHT = 10
  const BALL_RADIUS = 8
  const BRICK_WIDTH = 60
  const BRICK_HEIGHT = 20
  const BRICK_PADDING = 3
  const BRICK_OFFSET_TOP = 60
  const BRICK_OFFSET_LEFT = 30

  const [ball, setBall] = useState<BreakoutBall>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 30,
    dx: 2,
    dy: -2
  })
  
  const [paddle, setPaddle] = useState<BreakoutPaddle>({
    x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    width: PADDLE_WIDTH
  })

  const [bricks, setBricks] = useState<BreakoutBrick[]>([])

  // Initialize bricks
  const initializeBricks = useCallback(() => {
    const newBricks: BreakoutBrick[] = []
    const brickRowCount = 5
    const brickColumnCount = 7
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
    
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        newBricks.push({
          x: (c * (BRICK_WIDTH + BRICK_PADDING)) + BRICK_OFFSET_LEFT,
          y: (r * (BRICK_HEIGHT + BRICK_PADDING)) + BRICK_OFFSET_TOP,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          visible: true,
          color: colors[r]
        })
      }
    }
    setBricks(newBricks)
  }, [])

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // Draw ball
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = '#FF6B6B'
    ctx.fill()
    ctx.closePath()
    
    // Draw paddle
    ctx.beginPath()
    ctx.rect(paddle.x, CANVAS_HEIGHT - PADDLE_HEIGHT - 10, paddle.width, PADDLE_HEIGHT)
    ctx.fillStyle = '#4ECDC4'
    ctx.fill()
    ctx.closePath()
    
    // Draw bricks
    bricks.forEach(brick => {
      if (brick.visible) {
        ctx.beginPath()
        ctx.rect(brick.x, brick.y, brick.width, brick.height)
        ctx.fillStyle = brick.color
        ctx.fill()
        ctx.closePath()
      }
    })
  }, [ball, paddle, bricks])

  const collisionDetection = useCallback(() => {
    setBricks(currentBricks => {
      const newBricks = [...currentBricks]
      let scoreIncrease = 0
      
      newBricks.forEach(brick => {
        if (brick.visible) {
          if (ball.x > brick.x && ball.x < brick.x + brick.width &&
              ball.y > brick.y && ball.y < brick.y + brick.height) {
            setBall(currentBall => ({ ...currentBall, dy: -currentBall.dy }))
            brick.visible = false
            scoreIncrease += 10
          }
        }
      })
      
      if (scoreIncrease > 0) {
        setScore(currentScore => currentScore + scoreIncrease)
      }
      
      return newBricks
    })
  }, [ball.x, ball.y])

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Ball collision with walls
    setBall(currentBall => {
      let newBall = { ...currentBall }
      
      if (newBall.x + BALL_RADIUS > CANVAS_WIDTH || newBall.x - BALL_RADIUS < 0) {
        newBall.dx = -newBall.dx
      }
      if (newBall.y - BALL_RADIUS < 0) {
        newBall.dy = -newBall.dy
      }
      
      // Ball collision with paddle
      if (newBall.y + BALL_RADIUS > CANVAS_HEIGHT - PADDLE_HEIGHT - 10 &&
          newBall.x > paddle.x && newBall.x < paddle.x + paddle.width) {
        newBall.dy = -newBall.dy
      }
      
      // Ball falls below paddle
      if (newBall.y + BALL_RADIUS > CANVAS_HEIGHT) {
        setLives(currentLives => {
          const newLives = currentLives - 1
          if (newLives <= 0) {
            setGameState('gameOver')
            onGameEnd(score)
          }
          return newLives
        })
        
        // Reset ball position
        newBall = {
          x: CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT - 30,
          dx: 2,
          dy: -2
        }
      }
      
      // Move ball
      newBall.x += newBall.dx
      newBall.y += newBall.dy
      
      return newBall
    })
    
    collisionDetection()
    
    // Check win condition
    const visibleBricks = bricks.filter(brick => brick.visible)
    if (visibleBricks.length === 0) {
      setGameState('gameOver')
      onGameEnd(score)
    }
    
    draw(ctx)
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, score, lives, paddle.x, paddle.width, bricks, collisionDetection, draw, onGameEnd])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setLives(3)
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 30,
      dx: 2,
      dy: -2
    })
    setPaddle({
      x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
      width: PADDLE_WIDTH
    })
    initializeBricks()
  }

  const pauseGame = () => {
    setGameState('paused')
  }

  const resumeGame = () => {
    setGameState('playing')
  }

  // Handle mouse movement
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      setPaddle(currentPaddle => ({
        ...currentPaddle,
        x: Math.max(0, Math.min(CANVAS_WIDTH - currentPaddle.width, mouseX - currentPaddle.width / 2))
      }))
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    return () => canvas.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Touch support for mobile
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      if (touch) {
        const touchX = touch.clientX - rect.left
        setPaddle(currentPaddle => ({
          ...currentPaddle,
          x: Math.max(0, Math.min(CANVAS_WIDTH - currentPaddle.width, touchX - currentPaddle.width / 2))
        }))
      }
    }

    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => canvas.removeEventListener('touchmove', handleTouchMove)
  }, [])

  // Game loop effect
  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState, gameLoop])

  // Initialize bricks on mount
  useEffect(() => {
    initializeBricks()
  }, [initializeBricks])

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Game Info */}
      <div className="flex items-center space-x-6 text-lg">
        <div className="score-display">
          Score: {score}
        </div>
        <div className="score-display">
          Lives: {lives}
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex items-center space-x-4">
        {gameState === 'idle' && (
          <button onClick={startGame} className="game-button">
            Start Game
          </button>
        )}
        
        {gameState === 'playing' && (
          <button onClick={pauseGame} className="game-button-secondary">
            Pause
          </button>
        )}
        
        {gameState === 'paused' && (
          <>
            <button onClick={resumeGame} className="game-button">
              Resume
            </button>
            <button onClick={() => setGameState('idle')} className="game-button-secondary">
              Restart
            </button>
          </>
        )}
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-border rounded bg-black cursor-none"
      />

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground max-w-md">
        <p className="mb-2">Move your mouse or finger to control the paddle.</p>
        <p>Break all the bricks to win! Don't let the ball fall below the paddle.</p>
      </div>
    </div>
  )
}