"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import type { Socket } from "socket.io-client"
import type { Room } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface WaitingRoomProps {
  socket: Socket
  room: Room
  username: string
}

export default function WaitingRoom({ socket, room, username }: WaitingRoomProps) {
  const [showBotOption, setShowBotOption] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if current user is the room creator (first player)
    if (room.players.length > 0 && room.players[0].username === username) {
      setIsCreator(true)
    }

    socket.on("show-bot-option", () => {
      setShowBotOption(true)
    })

    socket.on("bot-added", (data: { room: Room }) => {
      room = data.room
      setShowBotOption(false)
    })

    // Show bot option after 10 seconds if only one player
    if (room.players.length === 1) {
      const timer = setTimeout(() => {
        setShowBotOption(true)
      }, 10000)

      return () => clearTimeout(timer)
    }

    return () => {
      socket.off("show-bot-option")
      socket.off("bot-added")
    }
  }, [socket, room, username])

  const startGame = () => {
    if (room.players.length < 2) {
      toast({
        title: "Not enough players",
        description: "You need at least 2 players to start the game",
      })
      return
    }

    socket.emit("start-game", { roomCode: room.code })
  }

  const addBot = () => {
    socket.emit("add-bot", { roomCode: room.code })
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.code)
    toast({
      title: "Room code copied",
      description: "Share this code with your friends to join",
    })
  }

  return (
    // <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
    <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex flex-col gap-2">
            <span>Waiting Room</span>
            <div className="flex items-center justify-center gap-2 mt-5">
              <Badge className="text-lg px-3 py-1 cursor-pointer" onClick={copyRoomCode}>
                {room.code}
              </Badge>
              <span className="text-xs text-muted-foreground">(Click to copy)</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="font-medium">Players ({room.players.length})</span>
            </div>
            <div className="space-y-1 text-gray-600">
              {room.players.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>
                    {player.username} {player.username === username && "(You)"}
                  </span>
                  {player.isBot && <Badge variant="secondary">Bot</Badge>}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-sm text-gray-400">Rounds: {room.maxRounds}</div>

          {showBotOption && (
            <div className="space-y-2">
              { room.players.length >= 2 ? "" : <p className="text-sm text-center text-gray-400">No other players joined. Want to play with a bot?</p>}
              <Button onClick={addBot} className="w-full border-blue-500 hover:border-blue-600" variant="outline">
                Add Bot Player
              </Button>
            </div>
          )}

          {isCreator && room.players.length >= 2 && (
            <Button onClick={startGame} className="w-full bg-blue-500 hover:bg-blue-600">
              Start Game
            </Button>
          )}

          {room.players.length < 2 && !showBotOption && (
            <p className="text-center text-sm text-gray-400">
              Waiting for more players to join...
              <br />
              Share the room code with your friends!
            </p>
          )}

          {!isCreator && room.players.length >= 2 && (
            <p className="text-center text-sm text-gray-400">Waiting for the room creator to start the game...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
