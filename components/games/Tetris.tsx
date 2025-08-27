'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { TetrisPiece, TetrisGrid, GameState } from '@/types'

interface TetrisProps {
  onGameEnd: (score: number) => void
}

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const CELL_SIZE = 20

const TETRIS_PIECES = [
  { shape: [[1, 1, 1, 1]], color: '#00FFFF' }, // I
  { shape: [[1, 1], [1, 1]], color: '#FFFF00' }, // O
  { shape: [[0, 1, 0], [1, 1, 1]], color: '#FF00FF' }, // T
  { shape: [[0, 1, 1], [1, 1, 0]], color: '#00FF00' }, // S
  { shape: [[1, 1, 0], [0, 1, 1]], color: '#FF0000' }, // Z
  { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000FF' }, // J
  { shape: [[0, 0, 1], [1, 1, 1]], color: '#FFA500' }, // L
]

export default function Tetris({ onGameEnd }: TetrisProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const lastDropTimeRef = useRef<number>(0)
  
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [grid, setGrid] = useState<TetrisGrid>(() => 
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(''))
  )
  const [currentPiece, setCurrentPiece] = useState<TetrisPiece | null>(null)
  const [nextPiece, setNextPiece] = useState<TetrisPiece | null>(null)
  const [dropInterval, setDropInterval] = useState(1000)

  const createRandomPiece = useCallback((): TetrisPiece => {
    const pieceIndex = Math.floor(Math.random() * TETRIS_PIECES.length)
    const template = TETRIS_PIECES[pieceIndex]
    if (!template) {
      // Fallback to first piece if index is invalid
      const fallbackTemplate = TETRIS_PIECES[0]
      return {
        shape: fallbackTemplate.shape,
        color: fallbackTemplate.color,
        x: Math.floor(BOARD_WIDTH / 2) - 1,
        y: 0
      }
    }
    
    return {
      shape: template.shape,
      color: template.color,
      x: Math.floor(BOARD_WIDTH / 2) - 1,
      y: 0
    }
  }, [])

  const rotatePiece = useCallback((piece: TetrisPiece): TetrisPiece => {
    const rotated = piece.shape[0]?.map((_, index) =>
      piece.shape.map(row => row[index]).reverse()
    ) || []
    
    return {
      ...piece,
      shape: rotated
    }
  }, [])

  const isValidPosition = useCallback((piece: TetrisPiece, grid: TetrisGrid): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < (piece.shape[y]?.length || 0); x++) {
        if (piece.shape[y]?.[x]) {
          const newX = piece.x + x
          const newY = piece.y + y
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false
          }
          
          if (newY >= 0 && grid[newY]?.[newX] && grid[newY][newX] !== '') {
            return false
          }
        }
      }
    }
    return true
  }, [])

  const placePiece = useCallback((piece: TetrisPiece, grid: TetrisGrid): TetrisGrid => {
    const newGrid = grid.map(row => [...row])
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < (piece.shape[y]?.length || 0); x++) {
        if (piece.shape[y]?.[x]) {
          const newX = piece.x + x
          const newY = piece.y + y
          
          if (newY >= 0 && newY < BOARD_HEIGHT && newX >= 0 && newX < BOARD_WIDTH) {
            if (newGrid[newY]) {
              newGrid[newY][newX] = piece.color
            }
          }
        }
      }
    }
    
    return newGrid
  }, [])

  const clearLines = useCallback((grid: TetrisGrid): { newGrid: TetrisGrid; linesCleared: number } => {
    let linesCleared = 0
    const newGrid = grid.filter(row => {
      if (row.every(cell => cell !== '')) {
        linesCleared++
        return false
      }
      return true
    })
    
    while (newGrid.length < BOARD_HEIGHT) {
      newGrid.unshift(Array(BOARD_WIDTH).fill(''))
    }
    
    return { newGrid, linesCleared }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw grid
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const cell = grid[y]?.[x]
        if (cell && cell !== '') {
          ctx.fillStyle = cell
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1)
        }
      }
    }
    
    // Draw current piece
    if (currentPiece) {
      ctx.fillStyle = currentPiece.color
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < (currentPiece.shape[y]?.length || 0); x++) {
          if (currentPiece.shape[y]?.[x]) {
            const drawX = (currentPiece.x + x) * CELL_SIZE
            const drawY = (currentPiece.y + y) * CELL_SIZE
            ctx.fillRect(drawX, drawY, CELL_SIZE - 1, CELL_SIZE - 1)
          }
        }
      }
    }
    
    // Draw grid lines
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 1
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath()
      ctx.moveTo(x * CELL_SIZE, 0)
      ctx.lineTo(x * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE)
      ctx.stroke()
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * CELL_SIZE)
      ctx.lineTo(BOARD_WIDTH * CELL_SIZE, y * CELL_SIZE)
      ctx.stroke()
    }
  }, [grid, currentPiece])

  const gameLoop = useCallback((timestamp: number) => {
    if (gameState !== 'playing') return
    
    if (timestamp - lastDropTimeRef.current > dropInterval) {
      if (currentPiece) {
        const newPiece = { ...currentPiece, y: currentPiece.y + 1 }
        
        if (isValidPosition(newPiece, grid)) {
          setCurrentPiece(newPiece)
        } else {
          // Place the piece
          const newGrid = placePiece(currentPiece, grid)
          const { newGrid: gridAfterClear, linesCleared } = clearLines(newGrid)
          
          setGrid(gridAfterClear)
          
          if (linesCleared > 0) {
            setLines(prev => prev + linesCleared)
            setScore(prev => prev + linesCleared * 100 * level)
            setLevel(prev => Math.floor((lines + linesCleared) / 10) + 1)
          }
          
          // Create new piece
          const newCurrentPiece = nextPiece || createRandomPiece()
          const newNextPiece = createRandomPiece()
          
          if (!isValidPosition(newCurrentPiece, gridAfterClear)) {
            setGameState('gameOver')
            onGameEnd(score)
            return
          }
          
          setCurrentPiece(newCurrentPiece)
          setNextPiece(newNextPiece)
        }
      }
      
      lastDropTimeRef.current = timestamp
    }
    
    draw()
    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, currentPiece, nextPiece, grid, dropInterval, level, lines, score, isValidPosition, placePiece, clearLines, createRandomPiece, draw, onGameEnd])

  const startGame = () => {
    const newGrid: TetrisGrid = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(''))
    const firstPiece = createRandomPiece()
    const secondPiece = createRandomPiece()
    
    setGrid(newGrid)
    setCurrentPiece(firstPiece)
    setNextPiece(secondPiece)
    setScore(0)
    setLevel(1)
    setLines(0)
    setDropInterval(1000)
    setGameState('playing')
    lastDropTimeRef.current = 0
  }

  const pauseGame = () => {
    setGameState('paused')
  }

  const resumeGame = () => {
    setGameState('playing')
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || !currentPiece) return
      
      let newPiece = { ...currentPiece }
      
      switch (e.key) {
        case 'ArrowLeft':
          newPiece.x -= 1
          if (isValidPosition(newPiece, grid)) {
            setCurrentPiece(newPiece)
          }
          break
        case 'ArrowRight':
          newPiece.x += 1
          if (isValidPosition(newPiece, grid)) {
            setCurrentPiece(newPiece)
          }
          break
        case 'ArrowDown':
          newPiece.y += 1
          if (isValidPosition(newPiece, grid)) {
            setCurrentPiece(newPiece)
          }
          break
        case 'ArrowUp':
          newPiece = rotatePiece(newPiece)
          if (isValidPosition(newPiece, grid)) {
            setCurrentPiece(newPiece)
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, currentPiece, grid, isValidPosition, rotatePiece])

  // Update drop interval based on level
  useEffect(() => {
    setDropInterval(Math.max(50, 1000 - (level - 1) * 50))
  }, [level])

  // Start game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, gameLoop])

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Game Info */}
      <div className="flex items-center space-x-6 text-lg">
        <div className="score-display">Score: {score}</div>
        <div className="score-display">Level: {level}</div>
        <div className="score-display">Lines: {lines}</div>
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

      <div className="flex items-start space-x-6">
        {/* Game Canvas */}
        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH * CELL_SIZE}
          height={BOARD_HEIGHT * CELL_SIZE}
          className="border-2 border-border rounded bg-black"
        />
        
        {/* Next Piece Preview */}
        <div className="bg-card border border-border rounded p-4">
          <h3 className="text-sm font-bold mb-2">Next:</h3>
          <div className="w-20 h-20 bg-black border border-border rounded flex items-center justify-center">
            {nextPiece && (
              <div className="grid" style={{ gridTemplateColumns: `repeat(${nextPiece.shape[0]?.length || 1}, 1fr)` }}>
                {nextPiece.shape.map((row, y) =>
                  row.map((cell, x) => (
                    <div
                      key={`${x}-${y}`}
                      className="w-3 h-3 border border-gray-600"
                      style={{
                        backgroundColor: cell ? nextPiece.color : 'transparent'
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground max-w-md">
        <p className="mb-2">Use arrow keys: ← → to move, ↓ to drop faster, ↑ to rotate</p>
        <p>Complete horizontal lines to clear them and score points!</p>
      </div>
    </div>
  )
}