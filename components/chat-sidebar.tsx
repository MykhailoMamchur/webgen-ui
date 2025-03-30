"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Square, Plus, X, Clock, RotateCcw, ChevronDown, ChevronRight, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// Update the ChatSidebarProps interface to include git messages and onRestoreCheckpoint
interface ChatSidebarProps {
  messages: { role: "user" | "assistant" | "git"; content: string; action?: string; hash?: string }[]
  onSendMessage: (message: string) => void
  isGenerating?: boolean
  onAbortGeneration?: () => void
  noProjectSelected?: boolean
  onCreateProject?: () => void
  selectedElementsCount?: number
  onClearSelectedElements?: () => void
  onRestoreCheckpoint?: (hash: string) => void
  restoringCheckpoint?: string | null
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
  onRestoreCheckpoint,
  restoringCheckpoint = null,
}: ChatSidebarProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [expandedCheckpoints, setExpandedCheckpoints] = useState<Record<number, boolean>>({})
  // Add state for expanded messages
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({})
  // Add state to track checkpoint counts
  const [checkpointCounts, setCheckpointCounts] = useState<Record<string, number>>({})

  // Calculate checkpoint numbers when messages change
  useEffect(() => {
    const counts: Record<string, number> = {}
    let commitCount = 0

    messages.forEach((message) => {
      if (message.role === "git" && message.action === "commit" && message.hash) {
        commitCount++
        counts[message.hash] = commitCount
      }
    })

    setCheckpointCounts(counts)
  }, [messages])

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

  const toggleCheckpointExpansion = (index: number) => {
    setExpandedCheckpoints((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  // Add function to toggle message expansion
  const toggleMessageExpansion = (index: number) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  // Check if a message is long and should be collapsible
  const isLongMessage = (content: string): boolean => {
    const lines = content.split("\n")
    return lines.length > 10 || content.length > 600
  }

  // Format timestamp from content if available
  const extractTimestamp = (content: string): string => {
    // Try to extract timestamp in format like "Created on March 30, 2023 at 14:30"
    const match = content.match(/Created on ([^(]+)/)
    if (match && match[1]) {
      return match[1].trim()
    }
    return "Checkpoint"
  }

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
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 ${message.role === "git" ? "justify-center" : ""}`}
            >
              {message.role === "git" ? (
                <div className="w-full px-1">
                  <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      <div className="flex items-center">
                        <span className="text-indigo-300 font-medium">
                          {message.action === "commit"
                            ? `Checkpoint #${(message.hash && checkpointCounts[message.hash]) || "?"}`
                            : "Restored"}
                        </span>
                        {message.action === "commit" && message.content && (
                          <button
                            onClick={() => toggleCheckpointExpansion(index)}
                            className="ml-1.5 text-indigo-400 hover:text-indigo-300 focus:outline-none"
                          >
                            {expandedCheckpoints[index] ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {message.action === "commit" && message.hash && onRestoreCheckpoint && (
                      <button
                        onClick={() => onRestoreCheckpoint(message.hash!)}
                        disabled={restoringCheckpoint !== null}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded flex items-center transition-colors"
                      >
                        {restoringCheckpoint === message.hash ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent mr-1"></span>
                        ) : (
                          <RotateCcw className="h-3 w-3 mr-1" />
                        )}
                        {restoringCheckpoint === message.hash ? "Restoring" : "Restore"}
                      </button>
                    )}
                  </div>

                  {/* Expandable content */}
                  {expandedCheckpoints[index] && message.content && (
                    <div className="mt-1 ml-6 pl-2 border-l-2 border-indigo-500/20 text-xs text-gray-400">
                      {message.content}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`max-w-[85%] rounded-xl px-5 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/10"
                      : "bg-purple-500/10 text-purple-50"
                  }`}
                >
                  {isLongMessage(message.content) ? (
                    <div>
                      {/* Show preview or full content based on expanded state */}
                      <div className={expandedMessages[index] ? "" : "line-clamp-3 whitespace-pre-line"}>
                        {message.content}
                      </div>

                      {/* Show/hide toggle button */}
                      <button
                        onClick={() => toggleMessageExpansion(index)}
                        className="mt-2 text-xs opacity-80 hover:opacity-100 flex items-center"
                      >
                        {expandedMessages[index] ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Show more
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="whitespace-pre-line">{message.content}</div>
                  )}
                </div>
              )}
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

