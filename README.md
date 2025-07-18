# Skribble Game

A real-time multiplayer drawing and guessing game built with Next.js and Socket.IO.

## Features

- Create and join game rooms with unique room codes
- Bot player option if no one joins
- Drawing canvas with multiple tools (pencil, eraser, colors)
- Real-time chat for guessing words
- Turn-based gameplay with timer
- Scoring system based on guess speed
- Game over screen with final scores

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Socket.IO
- **Deployment**: Docker, Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/skribble-game.git
cd skribble-game
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create a `.env.local` file:
\`\`\`
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
\`\`\`

### Development

Run both the Next.js app and Socket.IO server concurrently:

\`\`\`bash
npm run dev:all
\`\`\`

Or run them separately:

\`\`\`bash
# Terminal 1: Start Next.js app
npm run dev

# Terminal 2: Start Socket.IO server
npm run server
\`\`\`

Visit `http://localhost:3000` to play the game.

### Production

Build the application:

\`\`\`bash
npm run build
\`\`\`

Start the production server:

\`\`\`bash
npm start
\`\`\`

### Docker Deployment

Build and run with Docker Compose:

\`\`\`bash
docker-compose up -d
\`\`\`

## Project Structure

\`\`\`
skribble-game/
├── app/                  # Next.js App Router
│   ├── page.tsx          # Home page (create/join room)
│   ├── room/[roomCode]/  # Game room pages
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── game/             # Game-specific components
│   └── ui/               # UI components
├── lib/                  # Utility functions and types
├── server/               # Socket.IO server
│   ├── index.js          # Server entry point
│   ├── game-handlers.js  # Game logic handlers
│   └── utils.js          # Server utilities
└── public/               # Static assets
\`\`\`

## Deployment

### Vercel

The app is configured for deployment on Vercel. The Socket.IO server needs to be deployed separately (e.g., on a VPS or a service like Heroku).

### Docker

You can deploy the entire application using the provided Dockerfile and docker-compose.yml.

## License

MIT
