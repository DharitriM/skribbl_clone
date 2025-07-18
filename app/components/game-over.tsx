"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award } from "lucide-react"

interface Player {
  id: string
  username: string
  score: number
  isBot?: boolean
}

interface Room {
  code: string
  players: Player[]
  maxRounds: number
  currentRound: number
  gameStarted: boolean
}

interface Props {
  room: Room
  onPlayAgain: () => void
}

export default function GameOver({ room, onPlayAgain }: Props) {
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score)
  const winner = sortedPlayers[0]

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-lg font-bold">#{position + 1}</span>
    }
  }

  const getPositionColor = (position: number) => {
    switch (position) {
      case 0:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
      case 1:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
      case 2:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
      default:
        return "bg-gray-100"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-4">🎉 Game Over! 🎉</CardTitle>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-green-600">🏆 {winner.username} Wins! 🏆</h2>
            <p className="text-gray-400">Final scores after {room.maxRounds} rounds</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Podium */}
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-lg ${getPositionColor(index)}`}
              >
                <div className="flex items-center gap-3">
                  {getPositionIcon(index)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{player.username}</span>
                      {player.isBot && <Badge variant="secondary">Bot</Badge>}
                    </div>
                    {index === 0 && <span className="text-sm opacity-90">Champion!</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{player.score}</div>
                  <div className="text-sm opacity-90">points</div>
                </div>
              </div>
            ))}
          </div>

          {/* Game Stats */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Game Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Room Code:</span>
                <span className="ml-2 font-mono">{room.code}</span>
              </div>
              <div>
                <span className="text-gray-400">Rounds Played:</span>
                <span className="ml-2">{room.maxRounds}</span>
              </div>
              <div>
                <span className="text-gray-400">Total Players:</span>
                <span className="ml-2">{room.players.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Highest Score:</span>
                <span className="ml-2">{winner.score} pts</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-600">
              New Game
            </Button>
            <Button onClick={onPlayAgain} variant="outline">
              View Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
