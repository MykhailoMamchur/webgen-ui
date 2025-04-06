"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Send,
  Square,
  Plus,
  X,
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Paperclip,
  ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

// Define an interface for image data
interface ImageData {
  file: File
  previewUrl: string
}

// Update the ChatSidebarProps interface to include image handling
interface ChatSidebarProps {
  messages: { role: "user" | "assistant" | "git"; content: string; action?: string; hash?: string }[]
  onSendMessage: (message: string, images?: ImageData[]) => void
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
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({})
  const [checkpointCounts, setCheckpointCounts] = useState<Record<string, number>>({})
  const { toast } = useToast()

  // Update state for multiple images
  const [selectedImages, setSelectedImages] = useState<ImageData[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)

  // Add a ref for the textarea to better control it
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Maximum number of images allowed
  const MAX_IMAGES = 5

  // Add a constant for the maximum file size (5MB in bytes)
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

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

    if (input.trim() || selectedImages.length > 0) {
      onSendMessage(input, selectedImages.length > 0 ? selectedImages : undefined)
      setInput("")
      // Clear the images after sending
      setSelectedImages([])

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "120px" // Reset to initial height
      }
    }
  }

  // Convert file to base64
  const fileToImageData = async (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve({
          file,
          previewUrl: reader.result as string,
        })
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Add a helper function to compress images after the fileToImageData function
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          let width = img.width
          let height = img.height
          const quality = 0.7 // Start with 70% quality
          const maxWidth = 1920 // Max width for very large images
          const maxDimension = 8000 // Maximum allowed dimension in pixels

          // Check if either dimension exceeds the maximum allowed
          if (width > maxDimension || height > maxDimension) {
            // Calculate scale factor to bring the larger dimension down to maxDimension
            const scaleFactor = Math.min(maxDimension / width, maxDimension / height)
            width = Math.round(width * scaleFactor)
            height = Math.round(height * scaleFactor)
          }
          // If image is very large, scale it down
          else if (width > maxWidth) {
            const ratio = maxWidth / width
            width = maxWidth
            height = Math.round(height * ratio)
          }

          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Could not get canvas context"))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          // Try to compress with decreasing quality until size is under limit
          const compressAndCheck = (currentQuality: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Could not create blob"))
                  return
                }

                if (blob.size <= MAX_IMAGE_SIZE || currentQuality <= 0.1) {
                  // Create a new file from the blob
                  const newFile = new File([blob], file.name, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  })
                  resolve(newFile)
                } else {
                  // Reduce quality and try again
                  compressAndCheck(currentQuality - 0.1)
                }
              },
              "image/jpeg",
              currentQuality,
            )
          }

          compressAndCheck(quality)
        }

        img.onerror = () => {
          reject(new Error("Failed to load image"))
        }

        img.src = event.target?.result as string
      }

      reader.onerror = () => {
        reject(new Error("Failed to read file"))
      }

      reader.readAsDataURL(file)
    })
  }

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Check if adding these files would exceed the limit
      if (selectedImages.length + e.target.files.length > MAX_IMAGES) {
        toast({
          title: "Image limit reached",
          description: `You can only upload a maximum of ${MAX_IMAGES} images.`,
          variant: "warning",
        })
        return
      }

      const newImages: ImageData[] = []
      let compressionApplied = false

      for (let i = 0; i < e.target.files.length; i++) {
        let file = e.target.files[i]
        if (file.type.startsWith("image/")) {
          try {
            // Check file size and compress if needed
            if (file.size > MAX_IMAGE_SIZE) {
              compressionApplied = true
              file = await compressImage(file)
            }

            const imageData = await fileToImageData(file)
            newImages.push(imageData)
          } catch (error) {
            console.error("Error processing image:", error)
          }
        }
      }

      if (newImages.length > 0) {
        setSelectedImages((prev) => [...prev, ...newImages])
      }

      // Reset the input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Handle image button click
  const handleImageButtonClick = () => {
    if (selectedImages.length >= MAX_IMAGES) {
      toast({
        title: "Image limit reached",
        description: `You can only upload a maximum of ${MAX_IMAGES} images.`,
        variant: "warning",
      })
      return
    }
    fileInputRef.current?.click()
  }

  // Handle removing a specific image
  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Handle removing all images
  const handleRemoveAllImages = () => {
    setSelectedImages([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  useEffect(() => {
    const dropArea = dropAreaRef.current
    if (!dropArea) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dropArea.classList.add("bg-purple-500/10")
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dropArea.classList.remove("bg-purple-500/10")
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dropArea.classList.remove("bg-purple-500/10")

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        // Check if adding these files would exceed the limit
        if (selectedImages.length + e.dataTransfer.files.length > MAX_IMAGES) {
          toast({
            title: "Image limit reached",
            description: `You can only upload a maximum of ${MAX_IMAGES} images.`,
            variant: "warning",
          })
          return
        }

        const newImages: ImageData[] = []
        let compressionApplied = false

        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          let file = e.dataTransfer.files[i]
          if (file.type.startsWith("image/")) {
            try {
              // Check file size and compress if needed
              if (file.size > MAX_IMAGE_SIZE) {
                compressionApplied = true
                file = await compressImage(file)
              }

              const imageData = await fileToImageData(file)
              newImages.push(imageData)
            } catch (error) {
              console.error("Error processing image:", error)
            }
          } else {
            toast({
              title: "Invalid file type",
              description: "Please drop only image files.",
              variant: "error",
            })
            return
          }
        }

        if (newImages.length > 0) {
          setSelectedImages((prev) => [...prev, ...newImages])
        }
      }
    }

    // Only add these handlers to the messages area
    dropArea.addEventListener("dragover", handleDragOver)
    dropArea.addEventListener("dragleave", handleDragLeave)
    dropArea.addEventListener("drop", handleDrop)

    return () => {
      dropArea.removeEventListener("dragover", handleDragOver)
      dropArea.removeEventListener("dragleave", handleDragLeave)
      dropArea.removeEventListener("drop", handleDrop)
    }
  }, [selectedImages, toast])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Add auto-resize effect for textarea with updated height limits
  useEffect(() => {
    const resizeTextarea = () => {
      const textarea = textareaRef.current
      if (textarea) {
        // Reset height to initial height to get the correct scrollHeight
        textarea.style.height = "120px" // Initial height as requested

        // Calculate available height (subtract button area height)
        const maxHeight = 250 - 56 // 250px max height minus button area (56px = 14px height + padding)

        // Set the height based on content with updated maximum height
        textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
      }
    }

    // Initial resize
    resizeTextarea()

    // Resize when input changes
    if (input !== undefined) {
      resizeTextarea()
    }
  }, [input])

  const toggleCheckpointExpansion = (index: number) => {
    setExpandedCheckpoints((prev: Record<number, boolean>) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const toggleMessageExpansion = (index: number) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const isLongMessage = (content: string): boolean => {
    const lines = content.split("\n")
    return lines.length > 10 || content.length > 600
  }

  const extractTimestamp = (content: string): string => {
    const match = content.match(/Created on ([^(]+)/)
    if (match && match[1]) {
      return match[1].trim()
    }
    return "Checkpoint"
  }

  return (
    <div className="w-[350px] min-w-[350px] border-r border-purple-900/20 bg-[#13111C] flex flex-col h-full">
      <div ref={dropAreaRef} className="flex-1 overflow-y-auto p-6 space-y-6 transition-colors duration-200">
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

      {/* Only show the input area when a project is selected */}
      {!noProjectSelected && (
        <div className="p-4 border-t border-purple-900/20">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              e.currentTarget.classList.add("bg-purple-500/20", "rounded-xl")
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              e.currentTarget.classList.remove("bg-purple-500/20", "rounded-xl")
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              e.currentTarget.classList.remove("bg-purple-500/20", "rounded-xl")
            }}
          >
            {/* Multiple images preview */}
            {selectedImages.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-300 font-medium">
                    {selectedImages.length} image{selectedImages.length !== 1 ? "s" : ""} attached
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveAllImages}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove all
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {selectedImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative rounded-lg overflow-hidden border border-purple-500/30 bg-gray-800"
                    >
                      <img
                        src={image.previewUrl || "/placeholder.svg"}
                        alt={`Image ${index + 1}`}
                        className="w-full h-20 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-gray-900/70 text-white rounded-full p-1 hover:bg-gray-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gray-900/70 text-white text-xs py-1 px-2 truncate">
                        {image.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input container with controlled height and separated button area */}
            <div className="relative rounded-xl bg-[#1E1A29] border border-purple-900/20 shadow-inner overflow-hidden">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
                disabled={isGenerating}
                multiple
              />

              {/* Textarea with fixed max height and bottom padding to make room for buttons */}
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isGenerating
                      ? "Generation in progress..."
                      : selectedElementsCount > 0
                        ? "Describe changes for selected elements..."
                        : selectedImages.length > 0
                          ? "Describe what to do with these images..."
                          : "Describe your website or request changes..."
                  }
                  className="min-h-[120px] max-h-[250px] w-full resize-none bg-transparent text-gray-200 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pt-4 pl-4 pr-4 pb-16 overflow-y-auto whitespace-normal break-words"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                  disabled={isGenerating}
                  style={{ height: "120px" }} // Initial height set to 120px as requested
                />
              </div>

              {/* Button container in a separate fixed position div */}
              <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#1E1A29] border-t border-purple-900/10 flex items-center justify-end px-3 z-10">
                {/* Image counter badge */}
                {selectedImages.length > 0 && (
                  <div className="mr-auto bg-purple-600 text-white text-xs rounded-full px-2 py-0.5 flex items-center">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    <span>
                      {selectedImages.length}/{MAX_IMAGES}
                    </span>
                  </div>
                )}

                {/* Image upload button */}
                <Button
                  type="button"
                  onClick={handleImageButtonClick}
                  className={`bg-[#2A2438] hover:bg-[#352D45] text-gray-300 rounded-lg h-8 w-8 p-0 flex items-center justify-center shadow-sm mr-2 ${
                    selectedImages.length >= MAX_IMAGES ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isGenerating || selectedImages.length >= MAX_IMAGES}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Button
                  type="submit"
                  className={`${
                    isGenerating ? "bg-red-600 hover:bg-red-500" : "bg-purple-600 hover:bg-purple-500"
                  } text-white rounded-lg h-8 px-4 flex items-center gap-1.5 shadow-sm font-medium`}
                >
                  {isGenerating ? (
                    <>
                      <Square className="h-4 w-4" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

