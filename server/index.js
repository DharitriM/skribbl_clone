const express = require("express")
const { createServer } = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
const { generateRoomCode, getRandomWords } = require("./utils")
const { handlePlayerConnection, startNextTurn } = require("./game-handlers")

// Initialize Express app and HTTP server
const app = express()
app.use(cors())
const server = createServer(app)

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    // origin: process.env.CORS_ORIGIN || "*",
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true, // Allow cookies to be sent
  },
})

// Game state
const rooms = new Map()

// Store timers outside to avoid duplication
const pendingDeletionTimers = new Map()

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK")
})

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  handlePlayerConnection(socket, io, rooms)

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)

    for (const [roomCode, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex((p) => p.id === socket.id)
      if (playerIndex !== -1) {
        const disconnectedPlayer = room.players[playerIndex]
        
        // Don't remove the player immediately, just mark as disconnected
        disconnectedPlayer.connected = false
        disconnectedPlayer.disconnectedAt = Date.now()

        console.log(`Player ${disconnectedPlayer.username} disconnected from room ${roomCode}`)

        // Check if all players are disconnected
        const connectedPlayers = room.players.filter(p => p.connected !== false)
        
        if (connectedPlayers.length === 0) {
          console.log(`⏳ Room ${roomCode} will be deleted in 60s unless someone rejoins`)
          
          // Clear existing timer if any
          if (pendingDeletionTimers.has(roomCode)) {
            clearTimeout(pendingDeletionTimers.get(roomCode))
          }
          
          const timer = setTimeout(() => {
            if (rooms.has(roomCode)) {
              const currentRoom = rooms.get(roomCode)
              // Double check no one reconnected
              const stillConnected = currentRoom.players.some(p => p.connected !== false)
              if (!stillConnected) {
                if (currentRoom.timer) clearInterval(currentRoom.timer)
                rooms.delete(roomCode)
                console.log(`🗑️ Room ${roomCode} deleted after timeout`)
              }
            }
            pendingDeletionTimers.delete(roomCode)
          }, 60000)

          pendingDeletionTimers.set(roomCode, timer)
        } else {
          // Update other players about the disconnection
          io.to(roomCode).emit("game-update", { room })

          // Handle drawer disconnection
          if (room.gameStarted && room.currentDrawer === socket.id) {
            if (room.timer) clearInterval(room.timer)

            room.drawerIndex = (room.drawerIndex + 1) % room.players.length
            if (room.drawerIndex === 0) room.currentRound++

            if (room.currentRound >= room.maxRounds) {
              room.gameState = "finished"
              io.to(roomCode).emit("game-update", { room })
            } else {
              setTimeout(() => {
                startNextTurn(roomCode, io, rooms)
              }, 3000)
            }
          }
        }
        break
      }
    }
  })

  // ✅ Add debugging for room state
  socket.on("get-room-debug", ({ roomCode }) => {
    const room = rooms.get(roomCode)
    console.log(`🐛 DEBUG Room ${roomCode}:`, room)
    socket.emit("room-debug", { room, exists: !!room })
  })
})

// Start the server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})

// Export for potential serverless deployment
module.exports = { app, server }