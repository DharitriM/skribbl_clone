export interface Player {
  id: string
  username: string
  score: number
  isBot?: boolean
  connected: boolean
  disconnectedAt?: string | null
}

export type GameState = "waiting" | "playing" | "finished"

export interface Room {
  code: string
  players: Player[]
  maxRounds: number
  currentRound: number
  gameStarted: boolean
  gameState: GameState
  currentDrawer: string
  currentWord: string | null
  turnStartTime: string | null
  drawerIndex: number
  timer: number | null
}

export interface GameData {
  room: Room
  currentDrawer: string
  currentWord?: string
  wordOptions?: string[]
  timeLeft: number
  isMyTurn: boolean
  gamePhase: "choosing" | "drawing" | "finished" | "waiting"
}

export interface Message {
  username: string
  message: string
  isCorrect?: boolean
}

export interface DrawData {
  x: number
  y: number
  prevX: number
  prevY: number
  color: string
  size: number
  tool: "pen" | "eraser"
}
