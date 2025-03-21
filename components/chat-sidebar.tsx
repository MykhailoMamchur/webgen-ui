"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChatSidebarProps {
  messages: { role: "user" | "assistant"; content: string }[]
  onSendMessage: (message: string) => void
  isGenerating?: boolean
  onAbortGeneration?: () => void
}

export default function ChatSidebar({
  messages,
  onSendMessage,
  isGenerating = false,
  onAbortGeneration,
}: ChatSidebarProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isGenerating && onAbortGeneration) {
      onAbortGeneration()
      return
    }

    if (input.trim()) {
      onSendMessage(input)
      setInput("")
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Add a fixed width to the chat sidebar to prevent it from shrinking
  return (
    <div className="w-[300px] min-w-[300px] border-r border-purple-900/20 bg-[#13111C] flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-5 py-3 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/10"
                  : "bg-purple-500/10 text-purple-50"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-purple-900/20">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isGenerating ? "Generation in progress..." : "Type your message..."}
            className="min-h-[80px] resize-none bg-gray-200 dark:bg-gray-300 text-gray-900 border-0 rounded-xl placeholder:text-gray-600 focus-visible:ring-purple-500/30"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            disabled={isGenerating}
          />
          <Button
            type="submit"
            className={`self-end ${
              isGenerating ? "bg-red-600 hover:bg-red-500" : "bg-purple-600 hover:bg-purple-500"
            } text-white shadow-lg shadow-purple-500/20 rounded-xl px-6`}
          >
            {isGenerating ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

