"use client"

import { useState, useEffect } from "react"
import type { Socket } from "socket.io-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Trophy, Users } from "lucide-react"
import Canvas from "./canvas"
import Chat from "./chat"
import GameOver from "./game-over"

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

interface GameData {
  room: Room
  currentDrawer: string
  currentWord?: string
  wordOptions?: string[]
  timeLeft: number
  isMyTurn: boolean
  gamePhase: "choosing" | "drawing" | "finished"
}

interface Props {
  socket: Socket
  room: Room
  username: string
}

export default function Game({ socket, room: initialRoom, username }: Props) {
  const [gameData, setGameData] = useState<GameData>({
    room: initialRoom,
    currentDrawer: "",
    timeLeft: 60,
    isMyTurn: false,
    gamePhase: "choosing",
  })
  const [messages, setMessages] = useState<Array<{ username: string; message: string; isCorrect?: boolean }>>([])
  const [gameOver, setGameOver] = useState(false)

  useEffect(() => {
    socket.on(
      "turn-started",
      (data: {
        room: Room
        currentDrawer: string
        wordOptions?: string[]
        timeLeft: number
      }) => {
        setGameData((prev) => ({
          ...prev,
          room: data.room,
          currentDrawer: data.currentDrawer,
          wordOptions: data.wordOptions,
          timeLeft: data.timeLeft,
          isMyTurn: data.currentDrawer === socket.id,
          gamePhase: data.wordOptions ? "choosing" : "drawing",
        }))
        setMessages([])
      },
    )

    socket.on("word-chosen", (data: { word: string; timeLeft: number }) => {
      setGameData((prev) => ({
        ...prev,
        currentWord: data.word,
        timeLeft: data.timeLeft,
        gamePhase: "drawing",
      }))
    })

    socket.on("timer-update", (data: { timeLeft: number }) => {
      setGameData((prev) => ({ ...prev, timeLeft: data.timeLeft }))
    })

    socket.on("chat-message", (data: { username: string; message: string; isCorrect?: boolean }) => {
      setMessages((prev) => [...prev, data])
    })

    socket.on(
      "correct-guess",
      (data: {
        username: string
        message: string
        score: number
        room: Room
      }) => {
        setMessages((prev) => [...prev, { username: data.username, message: data.message, isCorrect: true }])
        setGameData((prev) => ({ ...prev, room: data.room }))
      },
    )

    socket.on("turn-ended", (data: { room: Room }) => {
      setGameData((prev) => ({ ...prev, room: data.room }))
    })

    socket.on("game-finished", (data: { room: Room }) => {
      setGameData((prev) => ({ ...prev, room: data.room }))
      setGameOver(true)
    })

    return () => {
      socket.off("turn-started")
      socket.off("word-chosen")
      socket.off("timer-update")
      socket.off("chat-message")
      socket.off("correct-guess")
      socket.off("turn-ended")
      socket.off("game-finished")
    }
  }, [socket])

  const chooseWord = (word: string) => {
    socket.emit("choose-word", { roomCode: gameData.room.code, word })
  }

  const sendMessage = (message: string) => {
    socket.emit("chat-message", { roomCode: gameData.room.code, message })
  }

  if (gameOver) {
    return <GameOver room={gameData.room} onPlayAgain={() => setGameOver(false)} />
  }

  const currentPlayer = gameData.room.players.find((p) => p.id === gameData.currentDrawer)
  const myPlayer = gameData.room.players.find((p) => p.username === username)

  return (
    <div className="min-h-screen bg-current p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  Round {gameData.room.currentRound + 1}/{gameData.room.maxRounds}
                </Badge>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className={`font-mono text-lg ${gameData.timeLeft <= 10 ? "text-red-500" : ""}`}>
                    {gameData.timeLeft}s
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Room: {gameData.room.code}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Status */}
        <Card>
          <CardContent className="p-4 text-center">
            {gameData.gamePhase === "choosing" && gameData.isMyTurn && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Choose a word to draw:</h2>
                <div className="flex gap-2 justify-center flex-wrap">
                  {gameData.wordOptions?.map((word, index) => (
                    <Button key={index} onClick={() => chooseWord(word)} className="text-lg px-6 py-3">
                      {word}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {gameData.gamePhase === "choosing" && !gameData.isMyTurn && (
              <h2 className="text-xl">
                <span className="font-bold">{currentPlayer?.username}</span> is choosing a word...
              </h2>
            )}
            {gameData.gamePhase === "drawing" && gameData.isMyTurn && (
              <div className="space-y-2">
                <h2 className="text-xl">Your word is:</h2>
                <Badge className="text-2xl px-4 py-2">{gameData.currentWord}</Badge>
              </div>
            )}
            {gameData.gamePhase === "drawing" && !gameData.isMyTurn && (
              <h2 className="text-xl">
                <span className="font-bold">{currentPlayer?.username}</span> is drawing...
              </h2>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Scoreboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {gameData.room.players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      player.username === username ? "bg-blue-100" : "bg-gray-50"
                    } ${player.id === gameData.currentDrawer ? "ring-2 ring-green-500" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold">#{index + 1}</span>
                      <span>{player.username}</span>
                      {player.isBot && (
                        <Badge variant="secondary" className="text-xs">
                          Bot
                        </Badge>
                      )}
                    </div>
                    <span className="font-bold">{player.score}</span>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Canvas */}
          <div className="lg:col-span-2">
            <Canvas
              socket={socket}
              roomCode={gameData.room.code}
              isDrawer={gameData.isMyTurn && gameData.gamePhase === "drawing"}
            />
          </div>

          {/* Chat */}
          <Chat messages={messages} onSendMessage={sendMessage} disabled={gameData.isMyTurn} />
        </div>
      </div>
    </div>
  )
}
