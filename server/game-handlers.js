const { generateRoomCode, getRandomWords, createBotPlayer, simulateBotGuess } = require("./utils")

// Store timers outside to avoid duplication  
const pendingDeletionTimers = new Map()

/**
 * Start the next turn in a game
 * @param {string} roomCode Room code
 * @param {Object} io Socket.IO instance
 * @param {Map} rooms Map of game rooms
 */
function startNextTurn(roomCode, io, rooms) {
  const room = rooms.get(roomCode)
  if (!room) return

  if (room.currentRound >= room.maxRounds) {
    // Game finished
    room.gameState = "finished"
    io.to(roomCode).emit("game-update", { room })
    return
  }

  const currentDrawer = room.players[room.drawerIndex]
  room.currentDrawer = currentDrawer.id
  room.currentWord = null

  const wordOptions = getRandomWords(4)

  io.to(roomCode).emit("turn-started", {
    room,
    currentDrawer: currentDrawer.id,
    wordOptions: currentDrawer.isBot ? null : wordOptions,
    timeLeft: 60,
  })

  // If it's a bot's turn, auto-choose word
  if (currentDrawer.isBot) {
    const randomWord = wordOptions[Math.floor(Math.random() * wordOptions.length)]
    setTimeout(() => {
      if (!rooms.has(roomCode)) return

      const room = rooms.get(roomCode)
      room.currentWord = randomWord
      room.turnStartTime = Date.now()

      io.to(roomCode).emit("word-chosen", { word: randomWord, timeLeft: 60 })
      startTurnTimer(roomCode, io, rooms)

      // Bot doesn't draw, so we'll just wait for the timer to expire
    }, 2000)
  }
}

/**
 * Start the timer for a turn
 * @param {string} roomCode Room code
 * @param {Object} io Socket.IO instance
 * @param {Map} rooms Map of game rooms
 */
function startTurnTimer(roomCode, io, rooms) {
  const room = rooms.get(roomCode)
  if (!room) return

  let timeLeft = 60
  const timer = setInterval(() => {
    timeLeft--
    io.to(roomCode).emit("timer-update", { timeLeft })

    if (timeLeft <= 0) {
      clearInterval(timer)
      endCurrentTurn(roomCode, io, rooms)
    }
  }, 1000)

  room.timer = timer
}

/**
 * End the current turn
 * @param {string} roomCode Room code
 * @param {Object} io Socket.IO instance
 * @param {Map} rooms Map of game rooms
 */
function endCurrentTurn(roomCode, io, rooms) {
  const room = rooms.get(roomCode)
  if (!room) return

  if (room.timer) {
    clearInterval(room.timer)
    room.timer = null
  }

  // Move to next player
  room.drawerIndex = (room.drawerIndex + 1) % room.players.length

  // If we've completed a full round
  if (room.drawerIndex === 0) {
    room.currentRound++
  }

  io.to(roomCode).emit("turn-ended", { room })

  // Start next turn after a short delay
  setTimeout(() => {
    startNextTurn(roomCode, io, rooms)
  }, 3000)
}

/**
 * Handle player connection and socket events
 * @param {Object} socket Socket.IO socket
 * @param {Object} io Socket.IO instance
 * @param {Map} rooms Map of game rooms
 */
function handlePlayerConnection(socket, io, rooms) {
  socket.on("create-room", ({ username, maxRounds }) => {
    const roomCode = generateRoomCode();
    const room = {
      code: roomCode,
      players: [
        {
          id: socket.id,
          username,
          score: 0,
          connected: true, // ✅ Add connected status
        },
      ],
      maxRounds: maxRounds || 3,
      currentRound: 0,
      gameStarted: false,
      gameState: "waiting",
      currentDrawer: null,
      currentWord: null,
      turnStartTime: null,
      drawerIndex: 0,
      timer: null,
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.emit("room-created", { room });

    setTimeout(() => {
      const currentRoom = rooms.get(roomCode);
      if (
        currentRoom &&
        currentRoom.players.length === 1 &&
        !currentRoom.gameStarted
      ) {
        socket.emit("show-bot-option");
      }
    }, 10000);
  });

  socket.on("check-room", ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return socket.emit("room-not-found");
    socket.emit("room-exists");
  });

  socket.on("join-room", ({ username, roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      return socket.emit("error", { message: "Room not found" });
    }

    // Cancel pending deletion if someone is rejoining
    if (pendingDeletionTimers.has(roomCode)) {
      clearTimeout(pendingDeletionTimers.get(roomCode));
      pendingDeletionTimers.delete(roomCode);
      console.log(`⏹️ Cancelled deletion of room ${roomCode} - player rejoining`);
    }

    // Check if player already exists (reconnection)
    const existingPlayer = room.players.find(p => p.username === username);
    if (existingPlayer) {
      // Update socket ID for reconnection
      existingPlayer.id = socket.id;
      existingPlayer.connected = true;
      existingPlayer.disconnectedAt = null;
      console.log(`🔄 Player ${username} reconnected to room ${roomCode}`);
    } else {
      // Add new player
      room.players.push({ 
        id: socket.id, 
        username, 
        score: 0, 
        connected: true 
      });
      console.log(`➕ Player ${username} joined room ${roomCode}`);
    }

    socket.join(roomCode);

    console.log(`✅ JOIN-ROOM completed for ${username} in ${roomCode}`);
    console.log("🧩 Room players:", room.players.map(p => `${p.username} (${p.connected ? 'connected' : 'disconnected'})`));

    // ✅ Emit consistent game update to all players
    io.to(roomCode).emit("game-update", { room });
  });

  socket.on("add-bot", ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const bot = createBotPlayer();
    bot.connected = true; // ✅ Bots are always connected
    room.players.push(bot);
    io.to(roomCode).emit("game-update", { room });
  });

  socket.on("start-game", ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.players.length < 2) return;

    room.gameStarted = true;
    room.gameState = "playing";
    room.currentRound = 0;
    room.drawerIndex = 0;

    io.to(roomCode).emit("game-update", { room });
    startNextTurn(roomCode, io, rooms);
  });

  socket.on("choose-word", ({ roomCode, word }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.currentWord = word;
    room.turnStartTime = Date.now();

    io.to(roomCode).emit("word-chosen", { word, timeLeft: 60 });

    startTurnTimer(roomCode, io, rooms);

    const hasBot = room.players.some((p) => p.isBot);
    if (hasBot) {
      simulateBotGuess(roomCode, word, io, rooms);
    }
  });

  socket.on("draw", ({ roomCode, drawData }) => {
    socket.to(roomCode).emit("draw-data", drawData);
  });

  socket.on("clear-canvas", ({ roomCode }) => {
    socket.to(roomCode).emit("canvas-cleared");
  });

  socket.on("chat-message", ({ roomCode, message }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    if (
      room.currentWord &&
      message.toLowerCase().trim() === room.currentWord.toLowerCase()
    ) {
      const timeElapsed = Date.now() - room.turnStartTime;
      const score = Math.max(100 - Math.floor(timeElapsed / 600), 10);
      player.score += score;

      io.to(roomCode).emit("correct-guess", {
        username: player.username,
        message,
        score,
        room,
      });

      setTimeout(() => {
        endCurrentTurn(roomCode, io, rooms);
      }, 2000);
    } else {
      io.to(roomCode).emit("chat-message", {
        username: player.username,
        message,
      });
    }
  });
}

module.exports = {
  startNextTurn,
  startTurnTimer,
  endCurrentTurn,
  handlePlayerConnection,
}