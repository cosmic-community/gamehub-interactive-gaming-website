import Link from 'next/link'

interface GameCardProps {
  game: {
    id: string
    name: string
    description: string
    icon: string
    difficulty: string
    players: string
  }
}

export default function GameCard({ game }: GameCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-accent'
      case 'medium': return 'text-yellow-500'
      case 'hard': return 'text-destructive'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <Link href={`/games/${game.id}`} className="group block">
      <div className="game-container hover:bg-card/80 transition-all duration-300 group-hover:scale-105 group-hover:neon-glow">
        <div className="space-y-4">
          {/* Game Icon */}
          <div className="text-center">
            <div className="text-6xl mb-2 transition-transform group-hover:scale-110">
              {game.icon}
            </div>
          </div>

          {/* Game Info */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-center group-hover:text-primary transition-colors">
              {game.name}
            </h3>
            
            <p className="text-muted-foreground text-sm text-center leading-relaxed">
              {game.description}
            </p>

            {/* Game Metadata */}
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <div className="text-xs">
                <span className="text-muted-foreground">Difficulty: </span>
                <span className={`font-medium ${getDifficultyColor(game.difficulty)}`}>
                  {game.difficulty}
                </span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {game.players}
              </div>
            </div>

            {/* Play Button */}
            <div className="pt-2">
              <div className="game-button w-full text-center group-hover:bg-primary/90">
                🎮 Play Now
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}