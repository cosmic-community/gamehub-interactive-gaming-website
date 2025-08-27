'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { submitScore } from '@/lib/cosmic'
import type { TetrisPiece, TetrisGrid } from '@/types'

interface TetrisProps {
  onGameEnd: (score: number) => void
}

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const CELL_SIZE = 30

// Tetris piece shapes
const PIECES = [
  { shape: [[1, 1, 1, 1]], color: '#00f0f0' }, // I
  { shape: [[1, 1], [1, 1]], color: '#f0f000' }, // O
  { shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0' }, // T
  { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f000' }, // S
  { shape: [[1, 1, 0], [0, 1, 1]], color: '#f00000' }, // Z
  { shape: [[1, 0, 0], [1, 1, 1]], color: '#f0a000' }, // L
  { shape: [[0, 0, 1], [1, 1, 1]], color: '#0000f0' } // J
]

export default function Tetris({ onGameEnd }: TetrisProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameOver'>('idle')
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [playerName, setPlayerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Game state
  const gameStateRef = useRef({
    board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill('')) as TetrisGrid,
    currentPiece: null as TetrisPiece | null,
    nextPiece: null as TetrisPiece | null,
    dropTime: 0,
    dropInterval: 1000
  })

  const createPiece = useCallback((): TetrisPiece => {
    const pieceIndex = Math.floor(Math.random() * PIECES.length)
    const piece = PIECES[pieceIndex]
    if (!piece) {
      // Fallback to first piece if undefined
      const fallbackPiece = PIECES[0]!
      return {
        shape: fallbackPiece.shape,
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(fallbackPiece.shape[0]!.length / 2),
        y: 0,
        color: fallbackPiece.color
      }
    }
    
    return {
      shape: piece.shape,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor((piece.shape[0]?.length || 1) / 2),
      y: 0,
      color: piece.color
    }
  }, [])

  const isValidMove = useCallback((piece: TetrisPiece, newX: number, newY: number, newShape?: number[][]): boolean => {
    const shape = newShape || piece.shape
    
    for (let y = 0; y < shape.length; y++) {
      const row = shape[y]
      if (!row) continue
      
      for (let x = 0; x < row.length; x++) {
        const cell = row[x]
        if (cell) {
          const boardX = newX + x
          const boardY = newY + y
          
          // Check boundaries
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
            return false
          }
          
          // Check collision with existing pieces
          if (boardY >= 0) {
            const boardRow = gameStateRef.current.board[boardY]
            if (boardRow && boardRow[boardX]) {
              return false
            }
          }
        }
      }
    }
    return true
  }, [])

  const rotatePiece = useCallback((piece: TetrisPiece): number[][] => {
    const rotated = piece.shape[0]!.map((_, i) =>
      piece.shape.map(row => row[i] || 0).reverse()
    )
    return rotated
  }, [])

  const placePiece = useCallback((piece: TetrisPiece) => {
    const { board } = gameStateRef.current
    
    for (let y = 0; y < piece.shape.length; y++) {
      const row = piece.shape[y]
      if (!row) continue
      
      for (let x = 0; x < row.length; x++) {
        const cell = row[x]
        if (cell) {
          const boardY = piece.y + y
          const boardX = piece.x + x
          
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            const boardRow = board[boardY]
            if (boardRow) {
              boardRow[boardX] = piece.color
            }
          }
        }
      }
    }
  }, [])

  const clearLines = useCallback(() => {
    const { board } = gameStateRef.current
    let linesCleared = 0
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      const row = board[y]
      if (row && row.every(cell => cell !== '')) {
        // Clear the line
        board.splice(y, 1)
        board.unshift(Array(BOARD_WIDTH).fill(''))
        linesCleared++
        y++ // Check the same line again
      }
    }
    
    if (linesCleared > 0) {
      const points = [0, 40, 100, 300, 1200]
      const pointsIndex = Math.min(linesCleared, points.length - 1)
      setScore(prev => prev + (points[pointsIndex] || 0) * level)
      setLines(prev => prev + linesCleared)
    }
  }, [level])

  const spawnNewPiece = useCallback(() => {
    const { nextPiece } = gameStateRef.current
    
    gameStateRef.current.currentPiece = nextPiece || createPiece()
    gameStateRef.current.nextPiece = createPiece()
    
    // Check for game over
    if (gameStateRef.current.currentPiece && !isValidMove(gameStateRef.current.currentPiece, gameStateRef.current.currentPiece.x, gameStateRef.current.currentPiece.y)) {
      setGameState('gameOver')
    }
  }, [createPiece, isValidMove])

  const update = useCallback((deltaTime: number) => {
    const { currentPiece, dropInterval } = gameStateRef.current
    
    if (!currentPiece) return
    
    gameStateRef.current.dropTime += deltaTime
    
    if (gameStateRef.current.dropTime >= dropInterval) {
      // Try to move piece down
      if (isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y++
      } else {
        // Place piece and spawn new one
        placePiece(currentPiece)
        clearLines()
        spawnNewPiece()
      }
      gameStateRef.current.dropTime = 0
    }
  }, [isValidMove, placePiece, clearLines, spawnNewPiece])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const { board, currentPiece } = gameStateRef.current

    // Draw board
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      const row = board[y]
      if (!row) continue
      
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = row[x]
        if (cell) {
          ctx.fillStyle = cell
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
          ctx.strokeStyle = '#fff'
          ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        }
      }
    }

    // Draw current piece
    if (currentPiece) {
      ctx.fillStyle = currentPiece.color
      for (let y = 0; y < currentPiece.shape.length; y++) {
        const row = currentPiece.shape[y]
        if (!row) continue
        
        for (let x = 0; x < row.length; x++) {
          const cell = row[x]
          if (cell) {
            const drawX = (currentPiece.x + x) * CELL_SIZE
            const drawY = (currentPiece.y + y) * CELL_SIZE
            ctx.fillRect(drawX, drawY, CELL_SIZE, CELL_SIZE)
            ctx.strokeStyle = '#fff'
            ctx.strokeRect(drawX, drawY, CELL_SIZE, CELL_SIZE)
          }
        }
      }
    }
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing') return
    
    const { currentPiece } = gameStateRef.current
    if (!currentPiece) return
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (isValidMove(currentPiece, currentPiece.x - 1, currentPiece.y)) {
          currentPiece.x--
        }
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (isValidMove(currentPiece, currentPiece.x + 1, currentPiece.y)) {
          currentPiece.x++
        }
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        if (isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1)) {
          currentPiece.y++
          setScore(prev => prev + 1)
        }
        break
      case 'ArrowUp':
      case 'w':
      case 'W':
        const rotatedShape = rotatePiece(currentPiece)
        if (isValidMove(currentPiece, currentPiece.x, currentPiece.y, rotatedShape)) {
          currentPiece.shape = rotatedShape
        }
        break
      case ' ':
        e.preventDefault()
        // Hard drop
        while (isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1)) {
          currentPiece.y++
          setScore(prev => prev + 2)
        }
        break
    }
  }, [gameState, isValidMove, rotatePiece])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setLines(0)
    setLevel(1)
    
    // Reset game state
    gameStateRef.current.board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(''))
    gameStateRef.current.currentPiece = createPiece()
    gameStateRef.current.nextPiece = createPiece()
    gameStateRef.current.dropTime = 0
    gameStateRef.current.dropInterval = 1000
  }

  const handleSubmitScore = async () => {
    if (!playerName.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await submitScore('tetris', playerName.trim(), score)
      onGameEnd(score)
    } catch (error) {
      console.error('Failed to submit score:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    let lastTime = 0
    let animationFrame: number

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      if (gameState === 'playing') {
        update(deltaTime)
      }
      draw()
      
      animationFrame = requestAnimationFrame(gameLoop)
    }

    if (gameState === 'playing' || gameState === 'paused') {
      animationFrame = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [gameState, update, draw])

  useEffect(() => {
    // Update level and drop speed based on lines cleared
    const newLevel = Math.floor(lines / 10) + 1
    if (newLevel !== level) {
      setLevel(newLevel)
      gameStateRef.current.dropInterval = Math.max(50, 1000 - (newLevel - 1) * 50)
    }
  }, [lines, level])

  return (
    <div className="game-container space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">🟦 Tetris</h2>
        <p className="text-muted-foreground">
          Arrange falling blocks to complete lines. Clear multiple lines for bonus points!
        </p>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="score-display text-center">
          <div className="text-sm text-muted-foreground">Score</div>
          <div className="text-xl font-bold">{score.toLocaleString()}</div>
        </div>
        <div className="score-display text-center">
          <div className="text-sm text-muted-foreground">Lines</div>
          <div className="text-xl font-bold">{lines}</div>
        </div>
        <div className="score-display text-center">
          <div className="text-sm text-muted-foreground">Level</div>
          <div className="text-xl font-bold">{level}</div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH * CELL_SIZE}
          height={BOARD_HEIGHT * CELL_SIZE}
          className="tetris-canvas"
        />
      </div>

      {/* Game Controls */}
      <div className="text-center space-y-4">
        {gameState === 'idle' && (
          <div className="space-y-4">
            <button onClick={startGame} className="game-button text-lg px-8 py-3">
              🎮 Start Game
            </button>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><kbd className="px-2 py-1 bg-secondary rounded">← → ↓</kbd> or <kbd className="px-2 py-1 bg-secondary rounded">A D S</kbd> to move</p>
              <p><kbd className="px-2 py-1 bg-secondary rounded">↑</kbd> or <kbd className="px-2 py-1 bg-secondary rounded">W</kbd> to rotate</p>
              <p><kbd className="px-2 py-1 bg-secondary rounded">Space</kbd> to hard drop</p>
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
              <p className="text-lg">Lines Cleared: {lines}</p>
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