# GameHub - Interactive Gaming Website

![GameHub Preview](https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=1200&h=300&fit=crop&auto=format)

A comprehensive gaming website featuring multiple built-in games designed to entertain users of all ages. The platform combines classic arcade-style games with modern web technologies, offering smooth gameplay experiences directly in the browser.

## ✨ Features

- 🎮 **Multiple Built-in Games** - Tic-Tac-Toe, Snake, Memory Match, Number Puzzle, and Whack-a-Mole
- 🏆 **Real-time Scoring System** - Track high scores and personal bests
- 📱 **Responsive Gaming Interface** - Optimized for all device types
- ⏸️ **Game State Management** - Pause, resume, and restart functionality
- 🏅 **Leaderboard System** - Compare scores with other players
- 🎯 **Progressive Difficulty** - Games that adapt and increase in challenge
- 🎨 **Modern Gaming UI** - Dark theme with neon accents
- 🔄 **Real-time Updates** - Dynamic content from Cosmic CMS

## Clone this Project

Want to create your own version of this project with all the content and structure? Clone this Cosmic bucket and code repository to get started instantly:

[![Clone this Project](https://img.shields.io/badge/Clone%20this%20Project-29abe2?style=for-the-badge&logo=cosmic&logoColor=white)](https://app.cosmicjs.com/projects/new?clone_bucket=675dc12d76a0a4e169383136&clone_repository=68ae0ede1f09167261d592a1)

## Prompts

This application was built using the following prompts to generate the content structure and code:

### Content Model Prompt

> Create a content model for a web developer portfolio with projects, skills, work experience, and testimonials in a anime style

### Code Generation Prompt

> build a website with built in games

The app has been tailored to work with your existing Cosmic content structure and includes all the features requested above.

## 🛠️ Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Cosmic CMS** - Headless content management
- **React Hooks** - State management and game logic
- **LocalStorage** - Score persistence
- **Responsive Design** - Mobile-first approach

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Cosmic account and bucket

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gamehub
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Cosmic credentials:
   ```env
   COSMIC_BUCKET_SLUG=your-bucket-slug
   COSMIC_READ_KEY=your-read-key
   COSMIC_WRITE_KEY=your-write-key
   ```

4. **Run the development server**
   ```bash
   bun run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 Cosmic SDK Examples

### Fetching Game Scores
```typescript
import { cosmic } from '@/lib/cosmic'

// Get high scores for a specific game
export async function getGameScores(gameId: string) {
  try {
    const response = await cosmic.objects
      .find({
        type: 'game-scores',
        'metadata.game_id': gameId
      })
      .depth(1)

    return response.objects.sort((a, b) => 
      (b.metadata?.score || 0) - (a.metadata?.score || 0)
    )
  } catch (error) {
    if (error.status === 404) {
      return []
    }
    throw error
  }
}

// Submit a new score
export async function submitScore(gameId: string, playerName: string, score: number) {
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
    })
    
    return response.object
  } catch (error) {
    console.error('Error submitting score:', error)
    throw error
  }
}
```

## 🎯 Cosmic CMS Integration

This application integrates with Cosmic CMS to manage:

- **Game Scores** - High score tracking and leaderboards
- **Player Profiles** - User information and statistics  
- **Game Configuration** - Dynamic game settings and difficulty
- **Game Instructions** - Help content and tutorials

The content structure includes object types for games, scores, and player data, all accessible through the Cosmic SDK with real-time updates.

## 🌐 Deployment Options

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add environment variables in the Vercel dashboard
3. Deploy automatically on every push

### Netlify
1. Connect your repository to Netlify
2. Set build command: `bun run build`
3. Set publish directory: `.next`
4. Add environment variables in site settings

### Other Platforms
The application can be deployed to any platform that supports Next.js applications.

---

Built with ❤️ using [Cosmic](https://www.cosmicjs.com/docs) headless CMS
<!-- README_END -->