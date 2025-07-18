import { initializeSocket } from "./socket";
import type { Socket } from "socket.io-client";

// Room data shape returned from backend
interface RoomData {
  code: string;
  players: Array<{ id: string; username: string; score: number }>;
  maxRounds: number;
  currentRound: number;
  currentDrawer: string | null;
  currentWord: string | null;
  gameStarted: boolean;
  gameState: string;
  drawerIndex: number;
  timer: NodeJS.Timer | null;
  turnStartTime: number | null;
}

// Callbacks for direct methods
interface RoomCallbacks {
  onSuccess?: (room?: RoomData) => void;
  onError?: (error: any) => void;
  onNotFound?: () => void;
}

/**
 * Create a new room
 * @param username - Player's username
 * @param maxRounds - Maximum rounds for the game
 * @returns Promise that resolves with room code
 */
export const createRoom = (
  username = "Anonymous",
  maxRounds = 3
): Promise<{ roomCode: string }> => {
  return new Promise((resolve, reject) => {
    const socket = initializeSocket();

    const timeout = setTimeout(() => {
      reject(new Error("Connection timeout"));
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeout);
      socket.off("room-created", handleRoomCreated);
      socket.off("error", handleError);
      socket.off("connect_error", handleConnectError);
    };

    const handleRoomCreated = ({ room }: { room: RoomData }) => {
      console.log("✅ Room created successfully:", room);
      cleanup();

      if (room && room.code) {
        resolve({ roomCode: room.code });
      } else {
        reject(new Error("Invalid room data received"));
      }
    };

    const handleError = (data: any) => {
      console.error("❌ Socket error during room creation:", data);
      cleanup();
      reject(new Error(data.message || "Failed to create room"));
    };

    const handleConnectError = (error: Error) => {
      console.error("❌ Socket connection error:", error);
      cleanup();
      reject(new Error("Connection failed"));
    };

    socket.on("room-created", handleRoomCreated);
    socket.on("error", handleError);
    socket.on("connect_error", handleConnectError);

    const attemptCreateRoom = () => {
      if (socket.connected) {
        console.log("✅ Socket connected for room creation");
        socket.emit("create-room", { username, maxRounds });
      } else {
        console.log("⏳ Waiting for socket connection...");
        socket.once("connect", () => {
          console.log("✅ Socket connected for room creation");
          socket.emit("create-room", { username, maxRounds });
        });
      }
    };

    attemptCreateRoom();
  });
};

/**
 * Join an existing room
 * @param roomCode - Room code to join
 * @returns Promise that resolves with success status
 */
export const joinRoom = (roomCode: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const socket = initializeSocket();

    const timeout = setTimeout(() => {
      reject(new Error("Connection timeout"));
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeout);
      socket.off("room-exists", handleRoomExists);
      socket.off("room-not-found", handleRoomNotFound);
      socket.off("error", handleError);
      socket.off("connect_error", handleConnectError);
    };

    const handleRoomExists = () => {
      console.log("✅ Room exists:", roomCode);
      cleanup();
      resolve(true);
    };

    const handleRoomNotFound = () => {
      console.log("❌ Room not found:", roomCode);
      cleanup();
      resolve(false);
    };

    const handleError = (data: any) => {
      console.error("❌ Socket error during room check:", data);
      cleanup();
      reject(new Error(data.message || "Failed to check room"));
    };

    const handleConnectError = (error: Error) => {
      console.error("❌ Socket connection error:", error);
      cleanup();
      reject(new Error("Connection failed"));
    };

    socket.on("room-exists", handleRoomExists);
    socket.on("room-not-found", handleRoomNotFound);
    socket.on("error", handleError);
    socket.on("connect_error", handleConnectError);

    const attemptCheckRoom = () => {
      if (socket.connected) {
        console.log("✅ Socket connected for room check");
        socket.emit("check-room", { roomCode });
      } else {
        console.log("⏳ Waiting for socket connection...");
        socket.once("connect", () => {
          console.log("✅ Socket connected for room check");
          socket.emit("check-room", { roomCode });
        });
      }
    };

    attemptCheckRoom();
  });
};

/**
 * Direct room creation without promises
 */
export const createRoomDirect = (
  username: string,
  maxRounds: number,
  callbacks: RoomCallbacks
): Socket => {
  const socket = initializeSocket();

  socket.on("connect", () => {
    console.log("✅ Socket connected for room creation");
    socket.emit("create-room", { username, maxRounds });
  });

  socket.on("room-created", ({ room }: { room: RoomData }) => {
    console.log("✅ Room created successfully:", room);
    callbacks.onSuccess?.(room);
  });

  socket.on("error", (data: any) => {
    console.error("❌ Socket error during room creation:", data);
    callbacks.onError?.(data);
  });

  return socket;
};

/**
 * Direct room join without promises
 */
export const joinRoomDirect = (
  roomCode: string,
  callbacks: RoomCallbacks
): Socket => {
  const socket = initializeSocket();

  socket.on("connect", () => {
    console.log("✅ Socket connected for room check");
    socket.emit("check-room", { roomCode });
  });

  socket.on("room-exists", () => {
    console.log("✅ Room exists:", roomCode);
    callbacks.onSuccess?.();
  });

  socket.on("room-not-found", () => {
    console.log("❌ Room not found:", roomCode);
    callbacks.onNotFound?.();
  });

  socket.on("error", (data: any) => {
    console.error("❌ Socket error during room check:", data);
    callbacks.onError?.(data);
  });

  return socket;
};
