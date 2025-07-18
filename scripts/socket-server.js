"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { initializeSocket } from "@/lib/socket";
import WaitingRoom from "@/components/game/waiting-room";
import GameRoom from "@/components/game/game-room";

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const roomCode = params.roomCode || "";
  const username = searchParams.get("username") || "";

  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState("waiting");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roomCode || !username) return;

    const socketInstance = initializeSocket();
    setSocket(socketInstance);

    const handleConnect = () => {
      console.log("[Socket] Connected");
      socketInstance.emit("join-room", { username, roomCode });
    };

   const handleRoomJoined = (data) => {
      console.log("[Socket] room-joined", data);
      setRoom(data.room);

      // Use gameState if provided, or infer from gameStarted
      if (data.room.gameState) {
        setGameState(data.room.gameState);
      } else if (typeof data.room.gameStarted === "boolean") {
        setGameState(data.room.gameStarted ? "playing" : "waiting");
      }

      setIsLoading(false);
    };

    const handleGameUpdate = (data) => {
      console.log("[Socket] game-update", data);
      setRoom(data.room);
      setGameState(data.room.gameState);
      setIsLoading(false);
    };

    const handleRoomNotFound = () => {
      toast({
        title: "Room not found",
        description: "The room you're trying to join doesn't exist.",
        variant: "destructive",
      });
      router.push("/");
    };

    const handleError = (data) => {
      console.error("[Socket] error:", data);
      toast({
        title: "Error",
        description: data.message,
        variant: "destructive",
      });
      router.push("/");
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("room-joined", handleRoomJoined);
    socketInstance.on("game-update", handleGameUpdate);
    socketInstance.on("room-not-found", handleRoomNotFound);
    socketInstance.on("error", handleError);

    socketInstance.onAny((event, ...args) => {
      console.log(`⚡ [Socket] Event received: '${event}'`, ...args);
    });

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("room-joined", handleRoomJoined);
      socketInstance.off("game-update", handleGameUpdate);
      socketInstance.off("room-not-found", handleRoomNotFound);
      socketInstance.off("error", handleError);
      socketInstance.disconnect();
    };
  }, [roomCode, username, toast, router]);

  console.log({
    // roomCode,
    // username,
    // isLoading,
    // gameState,
    roomin:room,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Connecting to room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-lg font-semibold text-red-500">
          Failed to join room. Please try again.
        </p>
      </div>
    );
  }

  switch (gameState) {
    case "waiting":
      return <WaitingRoom socket={socket} room={room} username={username} />;
    case "playing":
      return <GameRoom socket={socket} room={room} username={username} />;
    case "finished":
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-xl font-bold text-green-600">🎉 Game Finished!</p>
        </div>
      );
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-center text-lg font-semibold text-gray-500">
            Unknown game state: {gameState}
          </p>
        </div>
      );
  }
}
