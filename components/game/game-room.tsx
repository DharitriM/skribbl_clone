"use client";

import { useState, useEffect } from "react";
import type { Socket } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, Trophy, Users } from "lucide-react";
import DrawingCanvas from "@/components/game/drawing-canvas";
import ChatBox from "@/components/game/chat-box";
import GameOver from "@/components/game/game-over";
import WordSelector from "@/components/game/word-selector";
import type { Room, GameData, Message } from "@/lib/types";

interface GameRoomProps {
  socket: Socket;
  room: Room;
  username: string;
}

export default function GameRoom({
  socket,
  room: initialRoom,
  username,
}: GameRoomProps) {
  console.log({ socket, initialRoom, username });
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    socket.on("turn-started", (data) => {
      setGameData({
        room: data.room,
        currentDrawer: data.currentDrawer,
        timeLeft: data.timeLeft,
        isMyTurn: data.currentDrawer === socket.id,
        gamePhase: data.wordOptions ? "choosing" : "drawing",
        wordOptions: data.wordOptions,
      });
      setMessages([]);
    });

    socket.on("word-chosen", (data) => {
      setGameData(
        (prev) =>
          prev && {
            ...prev,
            currentWord: data.word,
            timeLeft: data.timeLeft,
            gamePhase: "drawing",
          }
      );
    });

    socket.on("timer-update", ({ timeLeft }) => {
      setGameData(
        (prev) =>
          prev && {
            ...prev,
            timeLeft,
          }
      );
    });

    socket.on("chat-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("correct-guess", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          username: data.username,
          message: data.message,
          isCorrect: true,
        },
      ]);
      setGameData(
        (prev) =>
          prev && {
            ...prev,
            room: data.room,
          }
      );
    });

    socket.on("turn-ended", ({ room }) => {
      setGameData(
        (prev) =>
          prev && {
            ...prev,
            room,
            gamePhase: "choosing",
            currentDrawer: "",
            isMyTurn: false,
            timeLeft: 0,
            currentWord: "",
            wordOptions: undefined,
          }
      );
    });

    socket.on("game-finished", ({ room }) => {
      setGameData(
        (prev) =>
          prev && {
            ...prev,
            room,
            gamePhase: "finished",
          }
      );
      setGameOver(true);
    });

    return () => {
      socket.off("turn-started");
      socket.off("word-chosen");
      socket.off("timer-update");
      socket.off("chat-message");
      socket.off("correct-guess");
      socket.off("turn-ended");
      socket.off("game-finished");
    };
  }, [socket]);

  useEffect(() => {
    if (initialRoom) {
      setGameData({
        room: initialRoom,
        currentDrawer: "",
        timeLeft: 0,
        isMyTurn: false,
        gamePhase: "waiting",
        wordOptions: undefined,
      });
    }
  }, [initialRoom]);

  const chooseWord = (word: string) => {
    if (gameData?.room?.code) {
      socket.emit("choose-word", { roomCode: gameData.room.code, word });
    }
  };

  const sendMessage = (message: string) => {
    if (gameData?.room?.code) {
      socket.emit("chat-message", { roomCode: gameData.room.code, message });
    }
  };

  if (gameOver) {
    return <GameOver room={gameData ? gameData.room : initialRoom} />;
  }

  if (!gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameData.room.players.find(
    (p) => p.id === gameData.currentDrawer
  );
  console.log({ gameData, currentPlayer });

  return (
    <div className="min-h-screen bg-yellow-200 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  Round {gameData.room.currentRound + 1}/
                  {gameData.room.maxRounds}
                </Badge>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span
                    className={`font-mono text-lg ${
                      gameData.timeLeft <= 10 ? "text-red-500" : ""
                    }`}
                  >
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

        {/* Word Selection or Game Status */}
        <Card>
          <CardContent className="p-4 text-center">
            {gameData.gamePhase === "choosing" &&
              gameData.isMyTurn &&
              gameData.wordOptions && (
                <WordSelector
                  words={gameData.wordOptions}
                  onSelectWord={chooseWord}
                />
              )}

            {gameData.gamePhase === "choosing" && !gameData.isMyTurn && (
              <h2 className="text-xl">
                <span className="font-bold">{currentPlayer?.username}</span> is
                choosing a word...
              </h2>
            )}

            {gameData.gamePhase === "drawing" && gameData.isMyTurn && (
              <div className="space-y-2">
                <h2 className="text-xl">Your word is:</h2>
                <Badge className="text-2xl px-4 py-2">
                  {gameData.currentWord}
                </Badge>
              </div>
            )}

            {gameData.gamePhase === "drawing" && !gameData.isMyTurn && (
              <h2 className="text-xl">
                <span className="font-bold">{currentPlayer?.username}</span> is
                drawing...
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
                    className={`flex items-center justify-between p-2 rounded text-black/50 ${
                      player.username === username
                        ? "bg-yellow-100"
                        : "bg-yellow-50"
                    } ${
                      player.id === gameData.currentDrawer
                        ? "ring-2 ring-green-500"
                        : ""
                    }`}
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
            <DrawingCanvas
              socket={socket}
              roomCode={gameData.room.code}
              isDrawer={gameData.isMyTurn && gameData.gamePhase === "drawing"}
            />
          </div>

          {/* Chat */}
          <ChatBox
            messages={messages}
            onSendMessage={sendMessage}
            disabled={gameData.isMyTurn}
            currentWord={gameData.currentWord}
          />
        </div>
      </div>
    </div>
  );
}
