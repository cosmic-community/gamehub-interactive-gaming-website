'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { submitScore } from '@/lib/cosmic'
import type { BreakoutBall, BreakoutPaddle, BreakoutBrick } from '@/types'

interface BreakoutProps {
  onGameEnd: (score: number) => void
}

export default function Breakout({ onGameEnd }: BreakoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameOver'>('idle')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [playerName, setPlayerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Game constants
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600
  const PADDLE_WIDTH = 100
  const PADDLE_HEIGHT = 10
  const BALL_RADIUS = 8
  const BRICK_ROWS = 5
  const BRICK_COLS = 10
  const BRICK_WIDTH = 70
  const BRICK_HEIGHT = 20
  const BRICK_PADDING = 5

  // Game state
  const gameStateRef = useRef({
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 30, dx: 3, dy: -3 } as BreakoutBall,
    paddle: { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, width: PADDLE_WIDTH } as BreakoutPaddle,
    bricks: [] as BreakoutBrick[],
    keys: { left: false, right: false }
  })

  const initializeBricks = useCallback(() => {
    const bricks: BreakoutBrick[] = []
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']
    
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_PADDING + 30,
          y: r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_PADDING + 50,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          visible: true,
          color: colors[r % colors.length]
        })
      }
    }
    
    gameStateRef.current.bricks = bricks
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const { ball, paddle, bricks } = gameStateRef.current

    // Draw ball
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = '#ef4444'
    ctx.fill()
    ctx.closePath()

    // Draw paddle
    ctx.fillStyle = '#8b5cf6'
    ctx.fillRect(paddle.x, CANVAS_HEIGHT - 30, paddle.width, PADDLE_HEIGHT)

    // Draw bricks
    bricks.forEach(brick => {
      if (brick.visible) {
        ctx.fillStyle = brick.color
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
        
        // Add border
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height)
      }
    })
  }, [])

  const update = useCallback(() => {
    const { ball, paddle, bricks, keys } = gameStateRef.current

    // Move paddle
    if (keys.left && paddle.x > 0) {
      paddle.x -= 7
    }
    if (keys.right && paddle.x < CANVAS_WIDTH - paddle.width) {
      paddle.x += 7
    }

    // Move ball
    ball.x += ball.dx
    ball.y += ball.dy

    // Ball wall collision
    if (ball.x + BALL_RADIUS > CANVAS_WIDTH || ball.x - BALL_RADIUS < 0) {
      ball.dx = -ball.dx
    }
    if (ball.y - BALL_RADIUS < 0) {
      ball.dy = -ball.dy
    }

    // Ball paddle collision
    if (
      ball.y + BALL_RADIUS > CANVAS_HEIGHT - 30 &&
      ball.x > paddle.x &&
      ball.x < paddle.x + paddle.width &&
      ball.dy > 0
    ) {
      // Calculate bounce angle based on where ball hits paddle
      const hitPos = (ball.x - paddle.x) / paddle.width
      const angle = (hitPos - 0.5) * Math.PI / 3 // -60° to +60°
      const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)
      ball.dx = speed * Math.sin(angle)
      ball.dy = -speed * Math.cos(angle)
    }

    // Ball brick collision
    bricks.forEach(brick => {
      if (brick.visible) {
        if (
          ball.x + BALL_RADIUS > brick.x &&
          ball.x - BALL_RADIUS < brick.x + brick.width &&
          ball.y + BALL_RADIUS > brick.y &&
          ball.y - BALL_RADIUS < brick.y + brick.height
        ) {
          brick.visible = false
          ball.dy = -ball.dy
          setScore(prev => prev + 10 * level)
        }
      }
    })

    // Check for ball falling
    if (ball.y > CANVAS_HEIGHT) {
      setLives(prev => {
        const newLives = prev - 1
        if (newLives <= 0) {
          setGameState('gameOver')
          return 0
        }
        // Reset ball position
        ball.x = CANVAS_WIDTH / 2
        ball.y = CANVAS_HEIGHT - 30
        ball.dx = 3 * (Math.random() > 0.5 ? 1 : -1)
        ball.dy = -3
        return newLives
      })
    }

    // Check for level completion
    const visibleBricks = bricks.filter(brick => brick.visible).length
    if (visibleBricks === 0) {
      setLevel(prev => prev + 1)
      initializeBricks()
      // Reset ball and increase speed
      ball.x = CANVAS_WIDTH / 2
      ball.y = CANVAS_HEIGHT - 30
      ball.dx *= 1.1
      ball.dy *= 1.1
    }
  }, [level, initializeBricks])

  const gameLoop = useCallback(() => {
    update()
    draw()
  }, [update, draw])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setLives(3)
    setLevel(1)
    initializeBricks()
    
    // Reset ball and paddle positions
    gameStateRef.current.ball = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 30, dx: 3, dy: -3 }
    gameStateRef.current.paddle = { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, width: PADDLE_WIDTH }
  }

  const handleSubmitScore = async () => {
    if (!playerName.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await submitScore('breakout', playerName.trim(), score)
      onGameEnd(score)
    } catch (error) {
      console.error('Failed to submit score:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        gameStateRef.current.keys.left = true
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        gameStateRef.current.keys.right = true
        break
      case ' ':
        e.preventDefault()
        setGameState(prev => prev === 'playing' ? 'paused' : 'playing')
        break
    }
  }, [gameState])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        gameStateRef.current.keys.left = false
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        gameStateRef.current.keys.right = false
        break
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  useEffect(() => {
    let animationFrame: number

    if (gameState === 'playing') {
      const animate = () => {
        gameLoop()
        animationFrame = requestAnimationFrame(animate)
      }
      animate()
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [gameState, gameLoop])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    // Initial draw
    draw()
  }, [draw])

  return (
    <div className="game-container space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">🎯 Breakout</h2>
        <p className="text-muted-foreground">
          Use arrow keys or A/D to move the paddle. Break all bricks to advance!
        </p>
      </div>

      {/* Game Stats */}
      <div className="flex justify-between items-center">
        <div className="score-display">
          Score: {score.toLocaleString()}
        </div>
        <div className="score-display">
          Lives: {'❤️'.repeat(lives)}
        </div>
        <div className="score-display">
          Level: {level}
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          className="breakout-canvas"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Game Controls */}
      <div className="text-center space-y-4">
        {gameState === 'idle' && (
          <div className="space-y-4">
            <button onClick={startGame} className="game-button text-lg px-8 py-3">
              🎮 Start Game
            </button>
            <div className="text-sm text-muted-foreground">
              <p><kbd className="px-2 py-1 bg-secondary rounded">← →</kbd> or <kbd className="px-2 py-1 bg-secondary rounded">A D</kbd> to move paddle</p>
              <p><kbd className="px-2 py-1 bg-secondary rounded">Space</kbd> to pause/resume</p>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-2">
            <button
              onClick={() => setGameState('paused')}
              className="game-button-secondary"
            >
              ⏸️ Pause
            </button>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="space-y-2">
            <button
              onClick={() => setGameState('playing')}
              className="game-button"
            >
              ▶️ Resume
            </button>
            <button
              onClick={startGame}
              className="game-button-secondary"
            >
              🔄 Restart
            </button>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-destructive">Game Over!</h3>
              <p className="text-xl">Final Score: {score.toLocaleString()}</p>
              <p className="text-lg">Level Reached: {level}</p>
            </div>
            
            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2 bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={20}
              />
              
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleSubmitScore}
                  disabled={!playerName.trim() || isSubmitting}
                  className="game-button flex-1 disabled:opacity-50"
                >
                  {isSubmitting ? '💾 Saving...' : '💾 Save Score'}
                </button>
                
                <button
                  onClick={startGame}
                  className="game-button-secondary flex-1"
                >
                  🔄 Play Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}