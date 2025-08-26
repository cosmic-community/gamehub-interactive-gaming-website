import { createBucketClient } from '@cosmicjs/sdk'
import type { GameScore, GameConfig, PlayerProfile, CosmicResponse } from '@/types'

export const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
  writeKey: process.env.COSMIC_WRITE_KEY as string,
})

// Helper function for error handling
function hasStatus(error: unknown): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error;
}

// Get high scores for a specific game
export async function getGameScores(gameId: string): Promise<GameScore[]> {
  try {
    const response = await cosmic.objects
      .find({
        type: 'game-scores',
        'metadata.game_id': gameId
      })
      .props(['id', 'title', 'metadata'])
      .depth(1);

    const scores = response.objects as GameScore[];
    return scores.sort((a, b) => 
      (b.metadata?.score || 0) - (a.metadata?.score || 0)
    );
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch game scores');
  }
}

// Get all high scores
export async function getAllScores(): Promise<GameScore[]> {
  try {
    const response = await cosmic.objects
      .find({ type: 'game-scores' })
      .props(['id', 'title', 'metadata'])
      .depth(1);

    const scores = response.objects as GameScore[];
    return scores.sort((a, b) => 
      (b.metadata?.score || 0) - (a.metadata?.score || 0)
    );
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error('Failed to fetch all scores');
  }
}

// Submit a new score
export async function submitScore(gameId: string, playerName: string, score: number): Promise<GameScore> {
  try {
    const response = await cosmic.objects.insertOne({
      type: 'game-scores',
      title: `${playerName} - ${gameId} Score`,
      metadata: {
        game_id: gameId,
        player_name: playerName,
        score: score,
        played_at: new Date().toISOString()
      }
    });
    
    return response.object as GameScore;
  } catch (error) {
    console.error('Error submitting score:', error);
    throw new Error('Failed to submit score');
  }
}

// Get game configuration
export async function getGameConfig(gameId: string): Promise<GameConfig | null> {
  try {
    const response = await cosmic.objects.findOne({
      type: 'game-configs',
      slug: gameId
    });
    
    return response.object as GameConfig;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch game config');
  }
}

// Get or create player profile
export async function getPlayerProfile(username: string): Promise<PlayerProfile | null> {
  try {
    const response = await cosmic.objects.findOne({
      type: 'player-profiles',
      'metadata.username': username
    });
    
    return response.object as PlayerProfile;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch player profile');
  }
}

// Create player profile
export async function createPlayerProfile(username: string): Promise<PlayerProfile> {
  try {
    const response = await cosmic.objects.insertOne({
      type: 'player-profiles',
      title: `Player: ${username}`,
      slug: username.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      metadata: {
        username: username,
        games_played: 0,
        total_score: 0,
        created_date: new Date().toISOString()
      }
    });
    
    return response.object as PlayerProfile;
  } catch (error) {
    console.error('Error creating player profile:', error);
    throw new Error('Failed to create player profile');
  }
}