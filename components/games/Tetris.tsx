'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { GameState } from '@/types'
import { submitScore } from '@/lib/cosmic'

interface Piece {
  shape: number[][]
  x: number
  y: number
  color: string
}

const GRID_WIDTH = 10
const GRID_HEIGHT = 20
const CELL_SIZE = 25

// Tetris piece shapes
const PIECES = [
  { shape: [[1, 1, 1, 1]], color: '#00f0f0' }, // I
  { shape: [[1, 1], [1, 1]], color: '#f0f000' }, // O
  { shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0' }, // T
  { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f000' }, // S
  { shape: [[1, 1, 0], [0, 1, 1]], color: '#f00000' }, // Z
  { shape: [[1, 0, 0], [1, 1, 1]], color: '#f0a000' }, // L
  { shape: [[0, 0, 1], [1, 1, 1]], color: '#0000f0' }, // J
]

export default function Tetris() {
  const [grid, setGrid] = useState<string[][]>(() =>
    Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(''))
  )
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null)
  const [nextPiece, setNextPiece] = useState<Piece | null>(null)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [dropTime, setDropTime] = useState(1000)
  const [playerName, setPlayerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  
  const gameLoopRef = useRef<NodeJS.Timeout>()
  const lastDropRef = useRef(Date.now())

  // Create new random piece
  const createPiece = useCallback((): Piece => {
    const template = PIECES[Math.floor(Math.random() * PIECES.length)]
    return {
      shape: template.shape,
      x: Math.floor(GRID_WIDTH / 2) - 1,
      y: 0,
      color: template.color
    }
  }, [])

  // Check if piece can be placed at position
  const canPlacePiece = useCallback((piece: Piece, newX: number, newY: number): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = newX + x
          const boardY = newY + y
          
          if (
            boardX < 0 || 
            boardX >= GRID_WIDTH || 
            boardY >= GRID_HEIGHT ||
            (boardY >= 0 && grid[boardY][boardX] !== '')
          ) {
            return false
          }
        }
      }
    }
    return true
  }, [grid])

  // Rotate piece
  const rotatePiece = useCallback((piece: Piece): Piece => {
    const rotated = piece.shape[0].map((_, index) =>
      piece.shape.map(row => row[index]).reverse()
    )
    return { ...piece, shape: rotated }
  }, [])

  // Clear completed lines
  const clearLines = useCallback(() => {
    setGrid(currentGrid => {
      const newGrid = [...currentGrid]
      let linesCleared = 0
      
      for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
        if (newGrid[y].every(cell => cell !== '')) {
          newGrid.splice(y, 1)
          newGrid.unshift(Array(GRID_WIDTH).fill(''))
          linesCleared++
          y++ // Check the same row again
        }
      }
      
      if (linesCleared > 0) {
        const points = [0, 100, 300, 500, 800][linesCleared] * level
        setScore(prev => prev + points)
        setLines(prev => {
          const newLines = prev + linesCleared
          const newLevel = Math.floor(newLines / 10) + 1
          setLevel(newLevel)
          setDropTime(Math.max(100, 1000 - (newLevel - 1) * 100))
          return newLines
        })
      }
      
      return newGrid
    })
  }, [level])

  // Place piece on grid
  const placePiece = useCallback((piece: Piece) => {
    setGrid(currentGrid => {
      const newGrid = currentGrid.map(row => [...row])
      
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x] && piece.y + y >= 0) {
            newGrid[piece.y + y][piece.x + x] = piece.color
          }
        }
      }
      
      return newGrid
    })
    
    clearLines()
    
    // Create next piece
    setCurrentPiece(nextPiece)
    setNextPiece(createPiece())
    
    // Check game over
    if (nextPiece && !canPlacePiece(nextPiece, nextPiece.x, nextPiece.y)) {
      setGameState('gameOver')
      setShowNameInput(true)
    }
  }, [nextPiece, createPiece, canPlacePiece, clearLines])

  // Move piece
  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece) return
    
    const newX = currentPiece.x + dx
    const newY = currentPiece.y + dy
    
    if (canPlacePiece(currentPiece, newX, newY)) {
      setCurrentPiece(prev => prev ? { ...prev, x: newX, y: newY } : null)
    } else if (dy > 0) {
      // Piece can't move down, place it
      placePiece(currentPiece)
    }
  }, [currentPiece, canPlacePiece, placePiece])

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return
    
    const now = Date.now()
    if (now - lastDropRef.current > dropTime) {
      movePiece(0, 1)
      lastDropRef.current = now
    }
  }, [gameState, dropTime, movePiece])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return
      
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault()
          movePiece(-1, 0)
          break
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault()
          movePiece(1, 0)
          break
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault()
          movePiece(0, 1)
          break
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          e.preventDefault()
          if (currentPiece) {
            const rotated = rotatePiece(currentPiece)
            if (canPlacePiece(rotated, rotated.x, rotated.y)) {
              setCurrentPiece(rotated)
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, movePiece, currentPiece, rotatePiece, canPlacePiece])

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(gameLoop, 16)
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
    const newGrid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(''))
    setGrid(newGrid)
    setCurrentPiece(createPiece())
    setNextPiece(createPiece())
    setScore(0)
    setLines(0)
    setLevel(1)
    setDropTime(1000)
    setGameState('playing')
    setShowNameInput(false)
    lastDropRef.current = Date.now()
  }

  const resetGame = () => {
    setGameState('idle')
    setScore(0)
    setLines(0)
    setLevel(1)
    setShowNameInput(false)
  }

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerName.trim() || score === 0) return

    setIsSubmitting(true)
    try {
      await submitScore('tetris', playerName.trim(), score)
      setShowNameInput(false)
      resetGame()
    } catch (error) {
      console.error('Failed to submit score:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render grid with current piece
  const renderGrid = () => {
    const displayGrid = grid.map(row => [...row])
    
    // Add current piece to display
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y
            const boardX = currentPiece.x + x
            if (boardY >= 0 && boardY < GRID_HEIGHT && boardX >= 0 && boardX < GRID_WIDTH) {
              displayGrid[boardY][boardX] = currentPiece.color
            }
          }
        }
      }
    }
    
    return displayGrid
  }

  return (
    <div className="space-y-6">
      {/* Game Info */}
      <div className="game-container">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="score-display">Score: {score}</div>
          <div className="score-display">Lines: {lines}</div>
          <div className="score-display">Level: {level}</div>
        </div>

        <div className="text-center text-sm text-muted-foreground mb-4">
          <p><strong>Controls:</strong> A/D or ←/→ to move, S/↓ to drop, W/↑/Space to rotate</p>
          <p>Complete horizontal lines to clear them and score points!</p>
        </div>

        <div className="flex justify-center gap-3">
          {gameState === 'idle' && (
            <button onClick={startGame} className="game-button">🎮 Start Game</button>
          )}
          <button onClick={resetGame} className="game-button-secondary">🔄 Reset</button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex justify-center gap-6">
        {/* Main Grid */}
        <div className="game-container relative">
          <div 
            className="grid border-2 border-border rounded bg-black p-2"
            style={{ 
              gridTemplateColumns: `repeat(${GRID_WIDTH}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(${GRID_HEIGHT}, ${CELL_SIZE}px)`
            }}
          >
            {renderGrid().map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="border border-gray-800"
                  style={{ 
                    backgroundColor: cell || 'transparent',
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`
                  }}
                />
              ))
            )}
          </div>

          {gameState === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
              <div className="text-center">
                <div className="text-4xl mb-4">🟦</div>
                <h3 className="text-xl font-bold mb-2">Ready for Tetris?</h3>
                <p className="text-muted-foreground">Arrange the falling blocks!</p>
              </div>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 rounded-lg">
              <div className="text-center space-y-4">
                <div className="text-4xl">🎮</div>
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

        {/* Next Piece Preview */}
        <div className="game-container w-32">
          <h4 className="text-center font-bold mb-4">Next</h4>
          {nextPiece && (
            <div className="grid gap-1 justify-center">
              {nextPiece.shape.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1">
                  {row.map((cell, colIndex) => (
                    <div
                      key={colIndex}
                      className="w-6 h-6 border"
                      style={{
                        backgroundColor: cell ? nextPiece.color : 'transparent'
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Touch Controls */}
      <div className="game-container">
        <div className="grid grid-cols-4 gap-2 max-w-64 mx-auto">
          <button 
            onClick={() => currentPiece && movePiece(-1, 0)}
            className="game-button-secondary p-3 text-xl"
            disabled={gameState !== 'playing'}
          >
            ⬅️
          </button>
          <button 
            onClick={() => {
              if (currentPiece) {
                const rotated = rotatePiece(currentPiece)
                if (canPlacePiece(rotated, rotated.x, rotated.y)) {
                  setCurrentPiece(rotated)
                }
              }
            }}
            className="game-button-secondary p-3 text-xl"
            disabled={gameState !== 'playing'}
          >
            🔄
          </button>
          <button 
            onClick={() => currentPiece && movePiece(1, 0)}
            className="game-button-secondary p-3 text-xl"
            disabled={gameState !== 'playing'}
          >
            ➡️
          </button>
          <button 
            onClick={() => currentPiece && movePiece(0, 1)}
            className="game-button-secondary p-3 text-xl"
            disabled={gameState !== 'playing'}
          >
            ⬇️
          </button>
        </div>
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