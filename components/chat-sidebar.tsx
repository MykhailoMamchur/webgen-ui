"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Square, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// Update the ChatSidebarProps interface to include selected elements info
interface ChatSidebarProps {
  messages: { role: "user" | "assistant"; content: string }[]
  onSendMessage: (message: string) => void
  isGenerating?: boolean
  onAbortGeneration?: () => void
  noProjectSelected?: boolean
  onCreateProject?: () => void
  selectedElementsCount?: number
  onClearSelectedElements?: () => void
}

export default function ChatSidebar({
  messages,
  onSendMessage,
  isGenerating = false,
  onAbortGeneration,
  noProjectSelected = false,
  onCreateProject,
  selectedElementsCount = 0,
  onClearSelectedElements,
}: ChatSidebarProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // If no project is selected, show create project prompt
    if (noProjectSelected && onCreateProject) {
      onCreateProject()
      return
    }

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
        {noProjectSelected ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="bg-purple-500/10 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-medium text-white mb-2">No Project Selected</h3>
              <p className="text-gray-300 mb-4">Create or select a project to start generating a website.</p>
              <Button onClick={onCreateProject} className="bg-purple-600 hover:bg-purple-500 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-5 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/10"
                    : "bg-purple-500/10 text-purple-50"
                } whitespace-pre-line`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Add selected elements indicator */}
      {selectedElementsCount > 0 && (
        <div className="px-4 py-2 border-t border-purple-900/20 bg-purple-500/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-300 font-medium">
              {selectedElementsCount} element{selectedElementsCount !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={onClearSelectedElements}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center"
            >
              <X className="h-3 w-3 mr-1" />
              Remove
            </button>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-purple-900/20">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              noProjectSelected
                ? "Create a project to start..."
                : isGenerating
                  ? "Generation in progress..."
                  : selectedElementsCount > 0
                    ? "Describe changes for selected elements..."
                    : "Describe your website or request changes..."
            }
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
              noProjectSelected
                ? "bg-purple-600 hover:bg-purple-500"
                : isGenerating
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-purple-600 hover:bg-purple-500"
            } text-white shadow-lg shadow-purple-500/20 rounded-xl px-6`}
          >
            {noProjectSelected ? (
              <>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </>
            ) : isGenerating ? (
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

