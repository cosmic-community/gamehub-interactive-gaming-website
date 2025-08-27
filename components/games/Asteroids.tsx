'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { GameState } from '@/types'
import { submitScore } from '@/lib/cosmic'

interface Ship {
  x: number
  y: number
  angle: number
  dx: number
  dy: number
}

interface Asteroid {
  x: number
  y: number
  dx: number
  dy: number
  size: number
  angle: number
}

interface Bullet {
  x: number
  y: number
  dx: number
  dy: number
  life: number
}

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 400

export default function Asteroids() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [playerName, setPlayerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  
  const [ship, setShip] = useState<Ship>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    angle: 0,
    dx: 0,
    dy: 0
  })
  
  const [asteroids, setAsteroids] = useState<Asteroid[]>([])
  const [bullets, setBullets] = useState<Bullet[]>([])
  const [keys, setKeys] = useState<Set<string>>(new Set())
  
  const gameLoopRef = useRef<number>()

  // Create asteroids for level
  const createAsteroids = useCallback((levelNum: number) => {
    const asteroidCount = 4 + levelNum * 2
    const newAsteroids: Asteroid[] = []
    
    for (let i = 0; i < asteroidCount; i++) {
      let x, y
      do {
        x = Math.random() * CANVAS_WIDTH
        y = Math.random() * CANVAS_HEIGHT
      } while (
        Math.sqrt((x - ship.x) ** 2 + (y - ship.y) ** 2) < 100
      )
      
      newAsteroids.push({
        x,
        y,
        dx: (Math.random() - 0.5) * 4,
        dy: (Math.random() - 0.5) * 4,
        size: 30 + Math.random() * 20,
        angle: Math.random() * Math.PI * 2
      })
    }
    
    setAsteroids(newAsteroids)
  }, [ship.x, ship.y])

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Update ship
    setShip(currentShip => {
      let newShip = { ...currentShip }
      
      // Handle rotation
      if (keys.has('ArrowLeft') || keys.has('KeyA')) {
        newShip.angle -= 0.2
      }
      if (keys.has('ArrowRight') || keys.has('KeyD')) {
        newShip.angle += 0.2
      }
      
      // Handle thrust
      if (keys.has('ArrowUp') || keys.has('KeyW')) {
        newShip.dx += Math.cos(newShip.angle) * 0.5
        newShip.dy += Math.sin(newShip.angle) * 0.5
      }
      
      // Apply friction
      newShip.dx *= 0.99
      newShip.dy *= 0.99
      
      // Update position
      newShip.x += newShip.dx
      newShip.y += newShip.dy
      
      // Wrap around screen
      if (newShip.x < 0) newShip.x = CANVAS_WIDTH
      if (newShip.x > CANVAS_WIDTH) newShip.x = 0
      if (newShip.y < 0) newShip.y = CANVAS_HEIGHT
      if (newShip.y > CANVAS_HEIGHT) newShip.y = 0
      
      return newShip
    })

    // Update bullets
    setBullets(currentBullets => {
      return currentBullets
        .map(bullet => ({
          ...bullet,
          x: bullet.x + bullet.dx,
          y: bullet.y + bullet.dy,
          life: bullet.life - 1
        }))
        .filter(bullet => 
          bullet.life > 0 &&
          bullet.x >= 0 && bullet.x <= CANVAS_WIDTH &&
          bullet.y >= 0 && bullet.y <= CANVAS_HEIGHT
        )
    })

    // Update asteroids
    setAsteroids(currentAsteroids => {
      return currentAsteroids.map(asteroid => ({
        ...asteroid,
        x: (asteroid.x + asteroid.dx + CANVAS_WIDTH) % CANVAS_WIDTH,
        y: (asteroid.y + asteroid.dy + CANVAS_HEIGHT) % CANVAS_HEIGHT,
        angle: asteroid.angle + 0.02
      }))
    })

    // Check bullet-asteroid collisions
    setBullets(currentBullets => {
      const remainingBullets = [...currentBullets]
      
      setAsteroids(currentAsteroids => {
        let newAsteroids = [...currentAsteroids]
        
        remainingBullets.forEach((bullet, bulletIndex) => {
          newAsteroids.forEach((asteroid, asteroidIndex) => {
            const distance = Math.sqrt(
              (bullet.x - asteroid.x) ** 2 + (bullet.y - asteroid.y) ** 2
            )
            
            if (distance < asteroid.size) {
              // Remove bullet and asteroid
              remainingBullets.splice(bulletIndex, 1)
              newAsteroids.splice(asteroidIndex, 1)
              
              // Add score
              setScore(prev => prev + 100)
              
              // Create smaller asteroids if big enough
              if (asteroid.size > 15) {
                for (let i = 0; i < 2; i++) {
                  newAsteroids.push({
                    x: asteroid.x,
                    y: asteroid.y,
                    dx: (Math.random() - 0.5) * 6,
                    dy: (Math.random() - 0.5) * 6,
                    size: asteroid.size / 2,
                    angle: Math.random() * Math.PI * 2
                  })
                }
              }
            }
          })
        })
        
        return newAsteroids
      })
      
      return remainingBullets
    })

    // Check ship-asteroid collisions
    asteroids.forEach(asteroid => {
      const distance = Math.sqrt((ship.x - asteroid.x) ** 2 + (ship.y - asteroid.y) ** 2)
      if (distance < asteroid.size + 10) {
        setLives(prev => {
          const newLives = prev - 1
          if (newLives <= 0) {
            setGameState('gameOver')
            setShowNameInput(true)
          }
          return newLives
        })
        
        // Reset ship position
        setShip(prev => ({
          ...prev,
          x: CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT / 2,
          dx: 0,
          dy: 0
        }))
      }
    })

    // Check for level complete
    if (asteroids.length === 0) {
      setLevel(prev => prev + 1)
      setTimeout(() => createAsteroids(level + 1), 1000)
    }

    // Draw ship
    ctx.save()
    ctx.translate(ship.x, ship.y)
    ctx.rotate(ship.angle)
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(15, 0)
    ctx.lineTo(-10, -8)
    ctx.lineTo(-10, 8)
    ctx.closePath()
    ctx.stroke()
    ctx.restore()

    // Draw asteroids
    asteroids.forEach(asteroid => {
      ctx.save()
      ctx.translate(asteroid.x, asteroid.y)
      ctx.rotate(asteroid.angle)
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, asteroid.size, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    })

    // Draw bullets
    bullets.forEach(bullet => {
      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2)
      ctx.fill()
    })

  }, [gameState, ship, asteroids, bullets, keys, level, createAsteroids])

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set(prev).add(e.code))
      
      if (e.code === 'Space') {
        e.preventDefault()
        if (gameState === 'playing') {
          // Shoot bullet
          setBullets(prev => [...prev, {
            x: ship.x,
            y: ship.y,
            dx: Math.cos(ship.angle) * 8,
            dy: Math.sin(ship.angle) * 8,
            life: 60
          }])
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
  }, [gameState, ship])

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = window.setInterval(gameLoop, 16)
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
    setShip({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      angle: 0,
      dx: 0,
      dy: 0
    })
    setScore(0)
    setLives(3)
    setLevel(1)
    setBullets([])
    createAsteroids(1)
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
      await submitScore('asteroids', playerName.trim(), score)
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
          <div className="score-display">Lives: {'🚀'.repeat(lives)}</div>
          <div className="score-display">Level: {level}</div>
        </div>

        <div className="text-center text-sm text-muted-foreground mb-4">
          <p><strong>Controls:</strong> A/D or ←/→ to rotate, W/↑ to thrust, Space to shoot</p>
          <p>Destroy all asteroids to advance to the next level!</p>
        </div>

        <div className="flex justify-center gap-3">
          {gameState === 'idle' && (
            <button onClick={startGame} className="game-button">🎮 Start Game</button>
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
          className="border border-border rounded mx-auto block bg-black"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-2">Ready for Space?</h3>
              <p className="text-muted-foreground">Destroy the asteroids!</p>
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
          </form>
        </div>
      )}
    </div>
  )
}