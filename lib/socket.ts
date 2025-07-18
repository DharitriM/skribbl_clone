import { io, Socket } from "socket.io-client";

// Define the expected shape of socket events if needed (optional typing for events)
let socket: Socket | null = null;

// Utility: Safe emit to avoid circular JSON crash
function safeEmit(event: string, data: any) {
  try {
    JSON.stringify(data); // This throws if circular
    socket?.emit(event, data);
  } catch (err) {
    console.error("❌ Cannot emit event due to circular/deep structure:", event, err);
  }
}

export const initializeSocket = (): Socket => {
  if (socket && socket.connected) {
    console.log("♻️ Reusing existing socket connection:", socket.id);
    return socket;
  }

  console.log("🔌 Creating new socket connection");
  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason: string) => {
    console.log("❌ Socket disconnected:", reason);
  });

  socket.on("connect_error", (error: Error) => {
    console.error("❌ Socket connection error:", error);
  });

  (socket as any).safeEmit = safeEmit; // safeEmit to socket instance for convenience

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    console.log("🔌 Disconnecting socket");
    socket.disconnect();
    socket = null;
  }
};
