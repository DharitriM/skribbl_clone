"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { initializeSocket, getSocket } from "@/lib/socket";
import WaitingRoom from "@/components/game/waiting-room";
import GameRoom from "@/components/game/game-room";
import type { Socket } from "socket.io-client";
import type { Room, GameState } from "@/lib/types";
import GameOver from "@/components/game/game-over";

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const roomCode = params.roomCode || "";
  const username = searchParams.get("username") || "";

  const [socket, setSocket] = useState<Socket | null>(null);


  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState("waiting");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roomCode || !username) {
      console.error("❌ Missing roomCode or username");
      router.push("/");
      return;
    }

    console.log("🔄 Room page initializing with:", { roomCode, username });

    // Get existing socket or create new one
    const socketInstance = initializeSocket();
    setSocket(socketInstance);

    const handleRoomJoined = (data:any) => {
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

    const handleGameUpdate = (data:any) => {
      console.log("[Socket] game-update", data);
      setRoom(data.room);
      if (data.room.gameState) {
        setGameState(data.room.gameState);
      }
      setIsLoading(false);
    };

    const handleRoomNotFound = () => {
      console.log("❌ Room not found");
      toast({
        title: "Room not found",
        description: "The room you're trying to join doesn't exist.",
        variant: "destructive",
      });
      router.push("/");
    };

    const handleError = (data: any) => {
      console.error("[Socket] error:", data);
      toast({
        title: "Error",
        description: data.message,
        variant: "destructive",
      });
      router.push("/");
    };

    const handleConnect = () => {
      console.log("[Socket] Connected - attempting to join room");
      socketInstance.emit("join-room", { username, roomCode });
    };

    const handleDisconnect = (reason: string) => {
      console.log("[Socket] Disconnected:", reason);
      setIsLoading(true);
    };

    const handleReconnect = () => {
      console.log("[Socket] Reconnected - rejoining room");
      socketInstance.emit("join-room", { username, roomCode });
    };

    // Set up event listeners
    socketInstance.on("room-joined", handleRoomJoined);
    socketInstance.on("game-update", handleGameUpdate);
    socketInstance.on("room-not-found", handleRoomNotFound);
    socketInstance.on("error", handleError);
    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("reconnect", handleReconnect);

    // Debug logging
    socketInstance.onAny((event, ...args) => {
      console.log(`⚡ [Socket] Event received: '${event}'`, ...args);
    });

    // If already connected, join immediately
    if (socketInstance.connected) {
      console.log("✅ Socket already connected, joining room immediately");
      socketInstance.emit("join-room", { username, roomCode });
    } else {
      console.log("⏳ Socket not connected, waiting for connection...");
    }

    // Cleanup function
    return () => {
      socketInstance.off("room-joined", handleRoomJoined);
      socketInstance.off("game-update", handleGameUpdate);
      socketInstance.off("room-not-found", handleRoomNotFound);
      socketInstance.off("error", handleError);
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.off("reconnect", handleReconnect);
      // Don't disconnect the socket here - let it persist for the session
    };
  }, [roomCode, username, toast, router]);

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
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-2">
          <p className="text-center text-lg font-semibold text-red-500">
            Failed to join room. Please try again.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  switch (gameState) {
    case "waiting":
      return <WaitingRoom socket={socket!} room={room} username={username} />;
    case "playing":
      return <GameRoom socket={socket!} room={room} username={username} />;
    case "finished":
      return (
        <GameOver room={room} />
        // <div className="min-h-screen flex items-center justify-center">
        //   <div className="text-center">
        //     <p className="text-xl font-bold text-green-600 mb-4">🎉 Game Finished!</p>
        //     <button
        //       onClick={() => router.push("/")}
        //       className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        //     >
        //       Play Again
        //     </button>
        //   </div>
        // </div>
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