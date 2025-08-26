'use client'

import { useState, useEffect } from 'react'
import { submitScore } from '@/lib/cosmic'
import type { Player, Board, GameState } from '@/types'

export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X')
  const [gameState, setGameState] = useState<GameState>('idle')
  const [winner, setWinner] = useState<Player | 'tie' | null>(null)
  const [score, setScore] = useState({ X: 0, O: 0, ties: 0 })
  const [playerName, setPlayerName] = useState('')
  const [vsComputer, setVsComputer] = useState(true)
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)

  // Check for winner
  useEffect(() => {
    const checkWinner = () => {
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
      ]

      for (const line of lines) {
        const [a, b, c] = line
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          setWinner(board[a])
          setGameState('gameOver')
          return
        }
      }

      if (board.every(cell => cell !== null)) {
        setWinner('tie')
        setGameState('gameOver')
        return
      }
    }

    if (gameState === 'playing') {
      checkWinner()
    }
  }, [board, gameState])

  // Computer move
  useEffect(() => {
    if (vsComputer && currentPlayer === 'O' && gameState === 'playing' && !winner) {
      const timer = setTimeout(() => {
        makeComputerMove()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, gameState, vsComputer, winner])

  const makeComputerMove = () => {
    const emptyCells = board.map((cell, index) => cell === null ? index : null).filter(val => val !== null) as number[]
    
    if (emptyCells.length > 0) {
      const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)]
      makeMove(randomIndex)
    }
  }

  const makeMove = (index: number) => {
    if (board[index] || gameState !== 'playing') return

    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
  }

  const startGame = () => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer('X')
    setGameState('playing')
    setWinner(null)
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer('X')
    setGameState('idle')
    setWinner(null)
    setScore({ X: 0, O: 0, ties: 0 })
  }

  const handleGameOver = async () => {
    if (winner && winner !== 'tie') {
      const newScore = { ...score }
      if (winner === 'X') {
        newScore.X++
        setScore(newScore)
        
        // Submit score if player name is provided
        if (playerName.trim() && !isSubmittingScore) {
          setIsSubmittingScore(true)
          try {
            await submitScore('tic-tac-toe', playerName.trim(), newScore.X)
          } catch (error) {
            console.error('Failed to submit score:', error)
          } finally {
            setIsSubmittingScore(false)
          }
        }
      } else {
        newScore.O++
        setScore(newScore)
      }
    } else if (winner === 'tie') {
      setScore(prev => ({ ...prev, ties: prev.ties + 1 }))
    }
  }

  useEffect(() => {
    if (winner) {
      handleGameOver()
    }
  }, [winner])

  return (
    <div className="game-container space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Tic-Tac-Toe</h2>
        
        {/* Player Name Input */}
        <div className="max-w-sm mx-auto">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-center"
            maxLength={20}
          />
        </div>

        {/* Game Mode Selection */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setVsComputer(true)}
            className={`px-4 py-2 rounded-md text-sm ${
              vsComputer ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            vs Computer
          </button>
          <button
            onClick={() => setVsComputer(false)}
            className={`px-4 py-2 rounded-md text-sm ${
              !vsComputer ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            vs Player
          </button>
        </div>
      </div>

      {/* Score Display */}
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        <div className="score-display text-center">
          <div className="text-2xl font-bold text-primary">X: {score.X}</div>
          <div className="text-xs text-muted-foreground">
            {vsComputer ? 'You' : 'Player 1'}
          </div>
        </div>
        <div className="score-display text-center">
          <div className="text-2xl font-bold text-muted-foreground">{score.ties}</div>
          <div className="text-xs text-muted-foreground">Ties</div>
        </div>
        <div className="score-display text-center">
          <div className="text-2xl font-bold text-destructive">O: {score.O}</div>
          <div className="text-xs text-muted-foreground">
            {vsComputer ? 'Computer' : 'Player 2'}
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-3 gap-2 aspect-square">
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => makeMove(index)}
              className="tic-tac-toe-cell game-cell hover:bg-muted/60 transition-colors"
              disabled={gameState !== 'playing' || (vsComputer && currentPlayer === 'O')}
            >
              <span className={cell === 'X' ? 'text-primary' : 'text-destructive'}>
                {cell}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Game Status */}
      <div className="text-center space-y-4">
        {gameState === 'idle' && (
          <div>
            <p className="text-muted-foreground mb-4">Ready to play?</p>
            <button onClick={startGame} className="game-button">
              Start Game
            </button>
          </div>
        )}

        {gameState === 'playing' && !winner && (
          <p className="text-lg">
            Current Player: 
            <span className={`font-bold ml-2 ${currentPlayer === 'X' ? 'text-primary' : 'text-destructive'}`}>
              {currentPlayer} {vsComputer && currentPlayer === 'O' ? '(Computer)' : ''}
            </span>
          </p>
        )}

        {gameState === 'gameOver' && winner && (
          <div className="space-y-4">
            <div className="text-xl font-bold">
              {winner === 'tie' ? (
                <span className="text-muted-foreground">It's a tie!</span>
              ) : (
                <span className={winner === 'X' ? 'text-primary' : 'text-destructive'}>
                  {winner} wins! 
                  {vsComputer && winner === 'X' ? ' You won!' : 
                   vsComputer && winner === 'O' ? ' Computer won!' : ''}
                </span>
              )}
            </div>
            
            {isSubmittingScore && (
              <p className="text-muted-foreground">Saving score...</p>
            )}
            
            <div className="flex gap-2 justify-center">
              <button onClick={startGame} className="game-button">
                Play Again
              </button>
              <button onClick={resetGame} className="game-button-secondary">
                Reset Score
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}