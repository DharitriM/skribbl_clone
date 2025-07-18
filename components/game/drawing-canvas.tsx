"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import type { Socket } from "socket.io-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Palette, Pencil, Eraser, Trash2 } from "lucide-react"
import type { DrawData } from "@/lib/types"

interface DrawingCanvasProps {
  socket: Socket
  roomCode: string
  isDrawer: boolean
}

const colors = [
  "#000000",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFC0CB",
  "#A52A2A",
  "#808080",
  "#FFFFFF",
]

export default function DrawingCanvas({ socket, roomCode, isDrawer }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentTool, setCurrentTool] = useState<"pen" | "eraser">("pen")
  const [currentColor, setCurrentColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(5)
  const [prevPos, setPrevPos] = useState({ x: 0, y: 0 })

  const draw = useCallback((data: DrawData) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineWidth = data.size
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (data.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out"
    } else {
      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = data.color
    }

    ctx.beginPath()
    ctx.moveTo(data.prevX, data.prevY)
    ctx.lineTo(data.x, data.y)
    ctx.stroke()
  }, [])

  useEffect(() => {
    // Initialize canvas
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set white background
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Set up socket listeners
    socket.on("draw-data", draw)

    socket.on("canvas-cleared", () => {
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    })

    return () => {
      socket.off("draw-data")
      socket.off("canvas-cleared")
    }
  }, [socket, draw])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return

    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(true)

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    setPrevPos({ x, y })
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    const drawData: DrawData = {
      x,
      y,
      prevX: prevPos.x,
      prevY: prevPos.y,
      color: currentColor,
      size: brushSize,
      tool: currentTool,
    }

    draw(drawData)
    socket.emit("draw", { roomCode, drawData })

    setPrevPos({ x, y })
  }

  const clearCanvas = () => {
    if (!isDrawer) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    socket.emit("clear-canvas", { roomCode })
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Drawing Canvas</span>
          {!isDrawer && <span className="text-sm text-gray-500">Watch mode</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drawing Tools */}
        {/* {isDrawer && ( */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={currentTool === "pen" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("pen")}
                disabled={!isDrawer}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant={currentTool === "eraser" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentTool("eraser")}
                disabled={!isDrawer}
              >
                <Eraser className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => clearCanvas()} disabled={!isDrawer}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Brush Size: {brushSize}px</label>
              <Slider
                value={[brushSize]}
                onValueChange={(value) => setBrushSize(value[0])}
                max={20}
                min={1}
                step={1}
                className="w-full"
                disabled={!isDrawer}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Colors
              </label>
              <div className="flex gap-1 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded border-2 ${
                      currentColor === color ? "border-gray-800" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentColor(color)}
                    aria-label={`Color ${color}`}
                    disabled={!isDrawer}
                  />
                ))}
              </div>
            </div>
          </div>
        {/* )} */}

        {/* Canvas */}
        <div className="border rounded-lg overflow-hidden bg-yellow-300">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full h-auto touch-none"
            style={{ cursor: isDrawer ? "crosshair" : "default" }}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={handleDraw}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={handleDraw}
          />
        </div>
      </CardContent>
    </Card>
  )
}
