import GameCard from '@/components/GameCard'

const games = [
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe',
    description: 'Classic X\'s and O\'s game. Try to get three in a row against the computer or a friend!',
    icon: '⭕',
    difficulty: 'Easy',
    players: '1-2 Players'
  },
  {
    id: 'snake',
    name: 'Snake Game',
    description: 'Control the snake to eat food and grow longer. Don\'t hit the walls or your own tail!',
    icon: '🐍',
    difficulty: 'Medium',
    players: '1 Player'
  },
  {
    id: 'memory-match',
    name: 'Memory Match',
    description: 'Flip cards to find matching pairs. Test your memory and concentration skills!',
    icon: '🧠',
    difficulty: 'Medium',
    players: '1 Player'
  },
  {
    id: 'number-puzzle',
    name: 'Number Puzzle',
    description: 'Slide tiles to arrange numbers in order. A classic sliding puzzle challenge!',
    icon: '🔢',
    difficulty: 'Hard',
    players: '1 Player'
  },
  {
    id: 'whack-a-mole',
    name: 'Whack-a-Mole',
    description: 'Hit the moles as they pop up from their holes! Quick reflexes required.',
    icon: '🔨',
    difficulty: 'Medium',
    players: '1 Player'
  }
]

export default function GamesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-destructive bg-clip-text text-transparent">
          All Games
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose from our collection of classic arcade games. Each game offers unique challenges and fun gameplay!
        </p>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {/* Game Instructions */}
      <section className="bg-card border border-border rounded-lg p-8 space-y-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center">How to Play</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              ⭕ Tic-Tac-Toe
            </h3>
            <p className="text-muted-foreground text-sm">
              Click on empty squares to place your mark. Get three in a row (horizontal, vertical, or diagonal) to win!
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🐍 Snake Game
            </h3>
            <p className="text-muted-foreground text-sm">
              Use arrow keys or WASD to control the snake. Eat food to grow longer, but don't hit walls or yourself!
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🧠 Memory Match
            </h3>
            <p className="text-muted-foreground text-sm">
              Click cards to flip them over. Find matching pairs by remembering card locations. Match all pairs to win!
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🔢 Number Puzzle
            </h3>
            <p className="text-muted-foreground text-sm">
              Click tiles adjacent to the empty space to slide them. Arrange numbers 1-15 in order to solve the puzzle!
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🔨 Whack-a-Mole
            </h3>
            <p className="text-muted-foreground text-sm">
              Click on moles as they pop up from holes. Quick reflexes earn more points. Don't let them get away!
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}