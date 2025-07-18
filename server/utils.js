// Word pool for the game
const words = [
  "cat",
  "dog",
  "house",
  "tree",
  "car",
  "book",
  "phone",
  "computer",
  "flower",
  "bird",
  "fish",
  "mountain",
  "ocean",
  "sun",
  "moon",
  "star",
  "cloud",
  "rain",
  "snow",
  "fire",
  "apple",
  "banana",
  "pizza",
  "cake",
  "coffee",
  "music",
  "dance",
  "smile",
  "heart",
  "love",
  "happy",
  "sad",
  "angry",
  "surprised",
  "scared",
  "excited",
  "tired",
  "hungry",
  "thirsty",
  "cold",
  "hot",
  "big",
  "small",
  "fast",
  "slow",
  "strong",
  "weak",
  "old",
  "young",
  "new",
  "airplane",
  "train",
  "boat",
  "bicycle",
  "robot",
  "dinosaur",
  "dragon",
  "castle",
  "beach",
  "forest",
]

/**
 * Generate a random room code
 * @returns {string} A 6-character uppercase room code
 */
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

/**
 * Get random words from the word pool
 * @param {number} count Number of words to get
 * @returns {string[]} Array of random words
 */
function getRandomWords(count = 4) {
  const shuffled = [...words].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

/**
 * Create a bot player
 * @returns {Object} Bot player object
 */
function createBotPlayer() {
  return {
    id: "bot-" + Math.random().toString(36).substring(7),
    username: "Bot Player",
    score: 0,
    isBot: true,
  }
}

/**
 * Simulate bot guessing behavior
 * @param {string} roomCode Room code
 * @param {string} word Current word to guess
 * @param {Object} io Socket.IO instance
 * @param {Map} rooms Map of game rooms
 */
function simulateBotGuess(roomCode, word, io, rooms) {
  const room = rooms.get(roomCode)
  if (!room || !room.gameStarted) return

  // Bot makes random guesses with some delay
  const guesses = ["circle", "square", "line", "house", "tree", "car", "cat", "dog"]

  // First random guess
  setTimeout(
    () => {
      if (!rooms.has(roomCode)) return
      const room = rooms.get(roomCode)
      if (!room.currentWord) return

      const randomGuess = guesses[Math.floor(Math.random() * guesses.length)]
      io.to(roomCode).emit("chat-message", {
        username: "Bot Player",
        message: randomGuess,
      })
    },
    Math.random() * 10000 + 5000,
  ) // Random delay between 5-15 seconds

  // Second random guess
  setTimeout(
    () => {
      if (!rooms.has(roomCode)) return
      const room = rooms.get(roomCode)
      if (!room.currentWord) return

      const randomGuess = guesses[Math.floor(Math.random() * guesses.length)]
      io.to(roomCode).emit("chat-message", {
        username: "Bot Player",
        message: randomGuess,
      })
    },
    Math.random() * 10000 + 20000,
  ) // Random delay between 20-30 seconds

  // Correct guess (50% chance)
  if (Math.random() > 0.5) {
    setTimeout(
      () => {
        if (!rooms.has(roomCode)) return
        const room = rooms.get(roomCode)
        if (!room.currentWord || room.currentWord !== word) return

        const botPlayer = room.players.find((p) => p.isBot)
        if (!botPlayer) return

        // Calculate score
        const timeElapsed = Date.now() - room.turnStartTime
        const score = Math.max(100 - Math.floor(timeElapsed / 600), 10)
        botPlayer.score += score

        io.to(roomCode).emit("correct-guess", {
          username: botPlayer.username,
          message: word,
          score,
          room,
        })

        // End turn after correct guess
        setTimeout(() => {
          endCurrentTurn(roomCode, io, rooms)
        }, 2000)
      },
      Math.random() * 15000 + 35000,
    ) // Random delay between 35-50 seconds
  }
}

function endCurrentTurn(roomCode, io, rooms) {
  // Implementation of endCurrentTurn
  const room = rooms.get(roomCode)
  if (!room) return

  // Logic to end the current turn
  room.turnStartTime = Date.now()
  // Emit event to start the next turn
  io.to(roomCode).emit("next-turn")
}

module.exports = {
  generateRoomCode,
  getRandomWords,
  createBotPlayer,
  simulateBotGuess,
  endCurrentTurn,
}
