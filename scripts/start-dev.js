const { spawn } = require("child_process")
const path = require("path")

console.log("🚀 Starting Skribble Game Development Environment...\n")

// Start Next.js development server
const nextProcess = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  cwd: process.cwd(),
})

// Start Socket.IO server
const serverProcess = spawn("node", ["server/index.js"], {
  stdio: "inherit",
  shell: true,
  cwd: process.cwd(),
})

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down servers...")
  nextProcess.kill("SIGINT")
  serverProcess.kill("SIGINT")
  process.exit(0)
})

process.on("SIGTERM", () => {
  nextProcess.kill("SIGTERM")
  serverProcess.kill("SIGTERM")
  process.exit(0)
})
