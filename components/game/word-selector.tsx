"use client"

import { Button } from "@/components/ui/button"

interface WordSelectorProps {
  words: string[]
  onSelectWord: (word: string) => void
}

export default function WordSelector({ words, onSelectWord }: WordSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Choose a word to draw:</h2>
      <div className="flex gap-2 justify-center flex-wrap">
        {words.map((word, index) => (
          <Button key={index} onClick={() => onSelectWord(word)} className="text-lg px-6 py-3">
            {word}
          </Button>
        ))}
      </div>
    </div>
  )
}
