// Base Cosmic object interface
interface CosmicObject {
  id: string;
  slug: string;
  title: string;
  content?: string;
  metadata: Record<string, any>;
  type: string;
  created_at: string;
  modified_at: string;
}

// Game score object type
interface GameScore extends CosmicObject {
  type: 'game-scores';
  metadata: {
    game_id: string;
    player_name: string;
    score: number;
    played_at: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  };
}

// Game configuration object type
interface GameConfig extends CosmicObject {
  type: 'game-configs';
  metadata: {
    game_id: string;
    settings: Record<string, any>;
    difficulty_levels: string[];
    max_score?: number;
  };
}

// Player profile object type
interface PlayerProfile extends CosmicObject {
  type: 'player-profiles';
  metadata: {
    username: string;
    games_played: number;
    total_score: number;
    favorite_game?: string;
    created_date: string;
  };
}

// Game states and types
type GameState = 'idle' | 'playing' | 'paused' | 'gameOver';

type GameType = 'tic-tac-toe' | 'snake' | 'memory-match' | 'number-puzzle' | 'whack-a-mole';

// Tic-tac-toe specific types
type Player = 'X' | 'O';
type BoardCell = Player | null;
type Board = BoardCell[];

// Snake game types
interface SnakeSegment {
  x: number;
  y: number;
}

interface Food {
  x: number;
  y: number;
}

type Direction = 'up' | 'down' | 'left' | 'right';

// Memory game types
interface MemoryCard {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// Number puzzle types
interface PuzzleTile {
  value: number;
  position: number;
}

// Whack-a-mole types
interface Mole {
  id: number;
  isActive: boolean;
  wasHit: boolean;
}

// API response types
interface CosmicResponse<T> {
  objects: T[];
  total: number;
  limit: number;
  skip: number;
}

// Utility types
type CreateGameScoreData = Omit<GameScore, 'id' | 'created_at' | 'modified_at'>;

// Type guards
function isGameScore(obj: CosmicObject): obj is GameScore {
  return obj.type === 'game-scores';
}

function isGameConfig(obj: CosmicObject): obj is GameConfig {
  return obj.type === 'game-configs';
}

function isPlayerProfile(obj: CosmicObject): obj is PlayerProfile {
  return obj.type === 'player-profiles';
}

export type {
  CosmicObject,
  GameScore,
  GameConfig,
  PlayerProfile,
  GameState,
  GameType,
  Player,
  BoardCell,
  Board,
  SnakeSegment,
  Food,
  Direction,
  MemoryCard,
  PuzzleTile,
  Mole,
  CosmicResponse,
  CreateGameScoreData
};

export {
  isGameScore,
  isGameConfig,
  isPlayerProfile
};