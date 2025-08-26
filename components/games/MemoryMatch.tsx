'use client'

import { useState, useEffect } from 'react'
import { submitScore } from '@/lib/cosmic'
import type { MemoryCard, GameState } from '@/types'

const SYMBOLS = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎪', '🎺']

export default function MemoryMatch() {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedCards, setMatchedCards] = useState<number[]>([])
  const [gameState, setGameState] = useState<GameState>('idle')
  const [moves, setMoves] = useState(0)
  const [timer, setTimer] = useState(0)
  const [bestTime, setBestTime] = useState<number | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)

  // Load best time from localStorage
  useEffect(() => {
    const savedBestTime = localStorage.getItem('memory-match-best-time')
    if (savedBestTime) {
      setBestTime(parseInt(savedBestTime))
    }
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameState])

  // Initialize cards
  const initializeCards = () => {
    const cardSymbols = [...SYMBOLS, ...SYMBOLS]
    const shuffledSymbols = cardSymbols.sort(() => Math.random() - 0.5)
    
    const initialCards: MemoryCard[] = shuffledSymbols.map((symbol, index) => ({
      id: index,
      symbol,
      isFlipped: false,
      isMatched: false
    }))
    
    setCards(initialCards)
    setFlippedCards([])
    setMatchedCards([])
    setMoves(0)
    setTimer(0)
  }

  const startGame = () => {
    initializeCards()
    setGameState('playing')
  }

  const resetGame = () => {
    initializeCards()
    setGameState('idle')
  }

  const flipCard = (cardId: number) => {
    if (gameState !== 'playing') return
    if (flippedCards.length >= 2) return
    if (flippedCards.includes(cardId)) return
    if (matchedCards.includes(cardId)) return

    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1)
      
      const card1 = cards.find(card => card.id === newFlippedCards[0])
      const card2 = cards.find(card => card.id === newFlippedCards[1])
      
      if (card1 && card2 && card1.symbol === card2.symbol) {
        // Match found
        setTimeout(() => {
          setMatchedCards(prev => [...prev, ...newFlippedCards])
          setFlippedCards([])
        }, 500)
      } else {
        // No match
        setTimeout(() => {
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  // Check for game completion
  useEffect(() => {
    if (matchedCards.length === cards.length && cards.length > 0) {
      setGameState('gameOver')
      
      // Calculate score (based on time and moves)
      const score = Math.max(1000 - timer - (moves * 10), 100)
      
      // Update best time
      if (!bestTime || timer < bestTime) {
        setBestTime(timer)
        localStorage.setItem('memory-match-best-time', timer.toString())
        
        // Submit score if player name is provided
        if (playerName.trim() && !isSubmittingScore) {
          setIsSubmittingScore(true)
          submitScore('memory-match', playerName.trim(), score)
            .catch(error => console.error('Failed to submit score:', error))
            .finally(() => setIsSubmittingScore(false))
        }
      }
    }
  }, [matchedCards, cards.length, timer, moves, bestTime, playerName, isSubmittingScore])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isCardVisible = (cardId: number) => {
    return flippedCards.includes(cardId) || matchedCards.includes(cardId)
  }

  return (
    <div className="game-container space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Memory Match</h2>
        
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
      </div>

      {/* Stats Display */}
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        <div className="score-display text-center">
          <div className="text-xl font-bold text-primary">{formatTime(timer)}</div>
          <div className="text-xs text-muted-foreground">Time</div>
        </div>
        <div className="score-display text-center">
          <div className="text-xl font-bold text-accent">{moves}</div>
          <div className="text-xs text-muted-foreground">Moves</div>
        </div>
        <div className="score-display text-center">
          <div className="text-xl font-bold text-destructive">
            {bestTime ? formatTime(bestTime) : '--:--'}
          </div>
          <div className="text-xs text-muted-foreground">Best</div>
        </div>
      </div>

      {/* Game Board */}
      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-4 gap-2 p-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => flipCard(card.id)}
              className={`memory-card transition-all duration-300 ${
                isCardVisible(card.id) 
                  ? matchedCards.includes(card.id)
                    ? 'matched scale-105'
                    : 'flipped'
                  : 'hover:scale-105'
              }`}
              disabled={gameState !== 'playing'}
            >
              {isCardVisible(card.id) ? card.symbol : '?'}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      {gameState === 'playing' && (
        <div className="max-w-md mx-auto">
          <div className="bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${(matchedCards.length / cards.length) * 100}%` }}
            />
          </div>
          <div className="text-center mt-2 text-sm text-muted-foreground">
            {matchedCards.length / 2} / {cards.length / 2} pairs found
          </div>
        </div>
      )}

      {/* Game Status */}
      <div className="text-center space-y-4">
        {gameState === 'idle' && (
          <div>
            <p className="text-muted-foreground mb-4">Match all the pairs to win!</p>
            <button onClick={startGame} className="game-button">
              🧠 Start Game
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div>
            <p className="text-muted-foreground">
              Find matching pairs by flipping cards
            </p>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="space-y-4">
            <div className="text-xl font-bold text-primary">🎉 Congratulations!</div>
            <div className="space-y-2">
              <div className="text-lg">
                Time: <span className="font-bold text-accent">{formatTime(timer)}</span>
              </div>
              <div className="text-lg">
                Moves: <span className="font-bold text-primary">{moves}</span>
              </div>
              
              {timer === bestTime && bestTime > 0 && (
                <div className="text-lg font-bold text-destructive">🏆 New Best Time!</div>
              )}
            </div>
            
            {isSubmittingScore && (
              <p className="text-muted-foreground">Saving score...</p>
            )}
            
            <div className="flex gap-2 justify-center">
              <button onClick={startGame} className="game-button">
                🔄 Play Again
              </button>
              <button onClick={resetGame} className="game-button-secondary">
                ⬅️ Main Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}