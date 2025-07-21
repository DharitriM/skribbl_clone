"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageCircle, Send } from "lucide-react"
import type { Message } from "@/lib/types"

interface ChatBoxProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  disabled: boolean
  currentWord?: string
}

export default function ChatBox({ messages, onSendMessage, disabled, currentWord }: ChatBoxProps) {
  const [inputMessage, setInputMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim() && !disabled) {
      onSendMessage(inputMessage.trim())
      setInputMessage("")
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-90">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 text-sm">
              {disabled ? "You're drawing! Others will guess here." : "Start guessing!"}
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm text-gray-800 border ${
                  msg.isCorrect ? "bg-green-100 text-green-800 border border-green-200" : "bg-gray-100"
                }`}
              >
                <span className="font-medium">{msg.username}:</span> <span>{msg.message}</span>
                {msg.isCorrect && <span className="ml-2 text-xs">✓ Correct!</span>}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={disabled ? "You're drawing..." : "Type your guess..."}
            disabled={disabled}
            className="flex-1"
          />
          <Button type="submit" disabled={disabled || !inputMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
