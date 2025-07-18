"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createRoom, joinRoom } from "@/lib/game-actions"

export default function Home() {
  const [username, setUsername] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [maxRounds, setMaxRounds] = useState(3)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to continue",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    console.log("🚀 Creating room with:", { username, maxRounds })
    
    try {
      const result = await createRoom(username, maxRounds) as { roomCode: string }
      console.log("✅ Room creation result:", result)
      
      if (result && result.roomCode) {
        const targetUrl = `/room/${result.roomCode}?username=${encodeURIComponent(username)}`
        console.log("🔄 Navigating to:", targetUrl)
        router.push(targetUrl)
      } else {
        console.error("❌ Invalid room creation result:", result)
        toast({
          title: "Error creating room",
          description: "Invalid response from server",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("❌ Room creation error:", error)
      toast({
        title: "Error creating room",
        description: typeof error === "object" && error !== null && "message" in error ? (error as { message: string }).message : "Please try again later",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!username.trim() || !roomCode.trim()) {
      toast({
        title: "Information required",
        description: "Please enter both username and room code",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    console.log("🚀 Joining room:", { username, roomCode })
    
    try {
      const success = await joinRoom(roomCode)
      console.log("✅ Room join result:", success)
      
      if (success) {
        const targetUrl = `/room/${roomCode}?username=${encodeURIComponent(username)}`
        console.log("🔄 Navigating to:", targetUrl)
        router.push(targetUrl)
      } else {
        console.log("❌ Room not found")
        toast({
          title: "Room not found",
          description: "Please check the room code and try again",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("❌ Room join error:", error)
      toast({
        title: "Error joining room",
        description: typeof error === "object" && error !== null && "message" in error ? (error as { message?: string }).message ?? "Please try again later" : "Please try again later",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    // <div className="min-h-screen bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 flex items-center justify-center p-4">
    <div className="min-h-screen bg-yellow-300 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black mb-2">Skribble Game</h1>
          <p className="text-gray-500">Draw, Guess, and Have Fun!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Join the Fun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-center"
              disabled={isLoading}
            />

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Rounds</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(Number.parseInt(e.target.value) || 3)}
                  disabled={isLoading}
                />
              </div>

              <Button
                onClick={handleCreateRoom}
                className="w-full bg-green-500 hover:bg-green-600"
                disabled={!username.trim() || isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isLoading ? "Creating..." : "Create Room"}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="text-center"
                disabled={isLoading}
              />
              <Button
                onClick={handleJoinRoom}
                className="w-full"
                disabled={!username.trim() || !roomCode.trim() || isLoading}
              >
                <LogIn className="w-4 h-4 mr-2" />
                {isLoading ? "Joining..." : "Join Room"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug info in development */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="bg-black/20 text-white p-2 rounded text-xs">
            <p>Debug: Username="{username}", RoomCode="{roomCode}"</p>
          </div>
        )} */}
      </div>
    </div>
  )
}