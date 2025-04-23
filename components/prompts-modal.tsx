"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Edit2,
  Trash2,
  Plus,
  Check,
  X,
  Settings,
  FileText,
  Sparkles,
  Clock,
  Calendar,
  ChevronRight,
  Info,
} from "lucide-react"
import type { Prompt } from "@/types/prompt"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface PromptsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PromptsModal({ isOpen, onClose }: PromptsModalProps) {
  const { toast } = useToast()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newPromptName, setNewPromptName] = useState("")
  const [newPromptText, setNewPromptText] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fetch all prompts when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPrompts()
      // Focus search input when modal opens
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 100)
    } else {
      // Reset state when modal closes
      setSearchQuery("")
      setActiveTab("all")
    }
  }, [isOpen])

  const fetchPrompts = async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/prompts/get_all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch prompts: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === "success" && Array.isArray(data.prompts)) {
        setPrompts(data.prompts)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error fetching prompts:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load prompts. Please try again.",
        variant: "destructive",
      })
      // Set empty array to avoid showing loading spinner indefinitely
      setPrompts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePrompt = async () => {
    if (!newPromptName.trim() || !newPromptText.trim()) {
      toast({
        title: "Error",
        description: "Prompt name and text are required.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/prompts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt_name: newPromptName.trim(),
          prompt_text: newPromptText.trim(),
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create prompt: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === "success") {
        toast({
          title: "Success",
          description: "Prompt created successfully.",
        })
        setNewPromptName("")
        setNewPromptText("")
        setIsCreating(false)
        setActiveTab("all")
        fetchPrompts()
      } else {
        throw new Error(data.message || "Failed to create prompt")
      }
    } catch (error) {
      console.error("Error creating prompt:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create prompt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePrompt = async () => {
    if (!editingPrompt || !editingPrompt.prompt_name.trim() || !editingPrompt.prompt_text.trim()) {
      toast({
        title: "Error",
        description: "Prompt name and text are required.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/prompts/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt_id: editingPrompt.id,
          prompt_name: editingPrompt.prompt_name.trim(),
          prompt_text: editingPrompt.prompt_text.trim(),
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update prompt: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === "success") {
        toast({
          title: "Success",
          description: "Prompt updated successfully.",
        })
        setEditingPrompt(null)
        fetchPrompts()
      } else {
        throw new Error(data.message || "Failed to update prompt")
      }
    } catch (error) {
      console.error("Error updating prompt:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update prompt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) {
      return
    }

    try {
      const response = await fetch("/api/prompts/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt_id: promptId,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete prompt: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === "success") {
        toast({
          title: "Success",
          description: "Prompt deleted successfully.",
        })
        fetchPrompts()
      } else {
        throw new Error(data.message || "Failed to delete prompt")
      }
    } catch (error) {
      console.error("Error deleting prompt:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete prompt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleActivatePrompt = async (promptId: string) => {
    try {
      const response = await fetch("/api/prompts/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt_id: promptId,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to activate prompt: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === "success") {
        toast({
          title: "Success",
          description: "Prompt status updated successfully.",
        })
        fetchPrompts()
      } else {
        throw new Error(data.message || "Failed to activate prompt")
      }
    } catch (error) {
      console.error("Error activating prompt:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update prompt status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return dateString
    }
  }

  // Filter prompts based on search query
  const filteredPrompts = prompts.filter(
    (prompt) =>
      prompt.prompt_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.prompt_text.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const activePrompts = filteredPrompts.filter((prompt) => prompt.is_active)
  const inactivePrompts = filteredPrompts.filter((prompt) => !prompt.is_active)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-0 bg-gradient-to-b from-[#1A1A1A] to-[#121212] text-white border border-purple-500/20 rounded-xl overflow-hidden shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-purple-500/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent flex items-center">
              <Settings className="h-5 w-5 mr-2 text-purple-400" />
              Prompt Management
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("create")}
                className="text-purple-300 hover:text-white hover:bg-purple-500/20"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Prompt
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-white hover:bg-purple-500/20 rounded-full h-8 w-8"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts..."
              className="pl-10 bg-[#252525] border-purple-500/20 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-white"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-[#252525] border border-purple-500/20 rounded-lg mb-4 p-1">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white rounded-md"
              >
                All Prompts
                <Badge variant="outline" className="ml-2 bg-[#333] text-white border-purple-500/30">
                  {filteredPrompts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white rounded-md"
              >
                Active Prompts
                <Badge variant="outline" className="ml-2 bg-purple-500/20 text-white border-purple-500/30">
                  {activePrompts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="create"
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white rounded-md"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create New
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex flex-col items-center">
                  <div className="relative h-12 w-12">
                    <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-t-2 border-purple-300 animate-spin animation-delay-150"></div>
                    <div className="absolute inset-4 rounded-full border-t-2 border-purple-100 animate-spin animation-delay-300"></div>
                  </div>
                  <p className="text-purple-300 mt-4 font-medium">Loading prompts...</p>
                </div>
              </div>
            ) : (
              <>
                <TabsContent value="all" className="m-0 outline-none">
                  <ScrollArea className="h-[500px] pr-4">
                    <AnimatePresence>
                      {filteredPrompts.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex flex-col items-center justify-center py-16 text-center"
                        >
                          {searchQuery ? (
                            <>
                              <Search className="h-16 w-16 text-purple-500/30 mb-4" />
                              <h3 className="text-xl font-medium text-white mb-2">No matching prompts</h3>
                              <p className="text-gray-400 max-w-md">
                                No prompts match your search query "{searchQuery}".
                              </p>
                              <Button
                                onClick={() => setSearchQuery("")}
                                className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                              >
                                Clear Search
                              </Button>
                            </>
                          ) : (
                            <>
                              <FileText className="h-16 w-16 text-purple-500/30 mb-4" />
                              <h3 className="text-xl font-medium text-white mb-2">No prompts found</h3>
                              <p className="text-gray-400 max-w-md">
                                Create your first prompt to enhance your website generation experience.
                              </p>
                              <Button
                                onClick={() => {
                                  setActiveTab("create")
                                  setIsCreating(true)
                                }}
                                className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Create New Prompt
                              </Button>
                            </>
                          )}
                        </motion.div>
                      ) : (
                        <div className="space-y-4">
                          {filteredPrompts.map((prompt, index) => (
                            <motion.div
                              key={prompt.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                              <PromptCard
                                prompt={prompt}
                                onEdit={() => setEditingPrompt(prompt)}
                                onDelete={() => handleDeletePrompt(prompt.id)}
                                onActivate={() => handleActivatePrompt(prompt.id)}
                                formatDate={formatDate}
                                searchQuery={searchQuery}
                              />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </AnimatePresence>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="active" className="m-0 outline-none">
                  <ScrollArea className="h-[500px] pr-4">
                    <AnimatePresence>
                      {activePrompts.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex flex-col items-center justify-center py-16 text-center"
                        >
                          {searchQuery ? (
                            <>
                              <Search className="h-16 w-16 text-purple-500/30 mb-4" />
                              <h3 className="text-xl font-medium text-white mb-2">No matching active prompts</h3>
                              <p className="text-gray-400 max-w-md">
                                No active prompts match your search query "{searchQuery}".
                              </p>
                              <Button
                                onClick={() => setSearchQuery("")}
                                className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                              >
                                Clear Search
                              </Button>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-16 w-16 text-purple-500/30 mb-4" />
                              <h3 className="text-xl font-medium text-white mb-2">No active prompts</h3>
                              <p className="text-gray-400 max-w-md">
                                Activate a prompt to use it in your website generation process.
                              </p>
                              {inactivePrompts.length > 0 ? (
                                <Button
                                  onClick={() => setActiveTab("all")}
                                  className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                                >
                                  View All Prompts
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => {
                                    setActiveTab("create")
                                    setIsCreating(true)
                                  }}
                                  className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create New Prompt
                                </Button>
                              )}
                            </>
                          )}
                        </motion.div>
                      ) : (
                        <div className="space-y-4">
                          {activePrompts.map((prompt, index) => (
                            <motion.div
                              key={prompt.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                              <PromptCard
                                prompt={prompt}
                                onEdit={() => setEditingPrompt(prompt)}
                                onDelete={() => handleDeletePrompt(prompt.id)}
                                onActivate={() => handleActivatePrompt(prompt.id)}
                                formatDate={formatDate}
                                searchQuery={searchQuery}
                              />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </AnimatePresence>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="create" className="m-0 outline-none">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-[#252525] border border-purple-500/20 rounded-xl overflow-hidden"
                  >
                    <div className="p-6 border-b border-purple-500/10">
                      <h3 className="text-xl font-medium text-white mb-1">Create New Prompt</h3>
                      <p className="text-gray-400 text-sm">
                        Define a custom prompt to guide the AI in generating your website
                      </p>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="new-prompt-name" className="text-white flex items-center">
                          Prompt Name
                          <span className="text-red-400 ml-1">*</span>
                        </Label>
                        <Input
                          id="new-prompt-name"
                          value={newPromptName}
                          onChange={(e) => setNewPromptName(e.target.value)}
                          placeholder="E.g., E-commerce Site, Portfolio, Blog"
                          className="bg-[#333333] border-purple-500/30 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-prompt-text" className="text-white flex items-center">
                          Prompt Text
                          <span className="text-red-400 ml-1">*</span>
                        </Label>
                        <Textarea
                          id="new-prompt-text"
                          value={newPromptText}
                          onChange={(e) => setNewPromptText(e.target.value)}
                          placeholder="Describe how you want the AI to generate your website..."
                          className="min-h-[250px] bg-[#333333] border-purple-500/30 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        />
                      </div>

                      <div className="bg-purple-500/10 rounded-lg p-4 flex items-start">
                        <Info className="h-5 w-5 text-purple-400 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="text-sm text-gray-300">
                          <p className="font-medium text-purple-300 mb-1">Prompt Writing Tips</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Be specific about the type of website you want</li>
                            <li>Include details about layout, colors, and functionality</li>
                            <li>Mention any specific sections or features you need</li>
                            <li>Describe your target audience and brand voice</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 p-6 border-t border-purple-500/10 bg-[#1E1E1E]">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNewPromptName("")
                          setNewPromptText("")
                          setActiveTab("all")
                        }}
                        className="border-purple-500/30 text-white hover:bg-purple-500/20"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreatePrompt}
                        disabled={!newPromptName.trim() || !newPromptText.trim()}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Prompt
                      </Button>
                    </div>
                  </motion.div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>

        {editingPrompt && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-[650px] bg-[#1A1A1A] border border-purple-500/20 rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-purple-500/10">
                <h3 className="text-xl font-medium text-white mb-1">Edit Prompt</h3>
                <p className="text-gray-400 text-sm">Update your prompt details</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-prompt-name" className="text-white flex items-center">
                    Prompt Name
                    <span className="text-red-400 ml-1">*</span>
                  </Label>
                  <Input
                    id="edit-prompt-name"
                    value={editingPrompt.prompt_name}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt_name: e.target.value })}
                    placeholder="Enter prompt name"
                    className="bg-[#333333] border-purple-500/30 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-prompt-text" className="text-white flex items-center">
                    Prompt Text
                    <span className="text-red-400 ml-1">*</span>
                  </Label>
                  <Textarea
                    id="edit-prompt-text"
                    value={editingPrompt.prompt_text}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt_text: e.target.value })}
                    placeholder="Enter prompt text"
                    className="min-h-[250px] bg-[#333333] border-purple-500/30 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {formatDate(editingPrompt.created_at)}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-purple-500/10 bg-[#1E1E1E]">
                <Button
                  variant="outline"
                  onClick={() => setEditingPrompt(null)}
                  className="border-purple-500/30 text-white hover:bg-purple-500/20"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdatePrompt}
                  disabled={!editingPrompt.prompt_name.trim() || !editingPrompt.prompt_text.trim()}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface PromptCardProps {
  prompt: Prompt
  onEdit: () => void
  onDelete: () => void
  onActivate: () => void
  formatDate: (date: string) => string
  searchQuery?: string
}

function PromptCard({ prompt, onEdit, onDelete, onActivate, formatDate, searchQuery = "" }: PromptCardProps) {
  // Function to highlight matching text in search results
  const highlightText = (text: string, query: string) => {
    if (!query) return text

    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-purple-500/30 text-white font-medium">
          {part}
        </span>
      ) : (
        part
      ),
    )
  }

  return (
    <div className="bg-[#252525] border border-purple-500/20 rounded-xl overflow-hidden hover:border-purple-500/40 transition-all duration-200 group">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-medium text-white flex items-center group-hover:text-purple-300 transition-colors">
              {searchQuery ? highlightText(prompt.prompt_name, searchQuery) : prompt.prompt_name}
              {prompt.is_active && <Badge className="ml-2 bg-purple-500 text-white border-none">Active</Badge>}
            </h3>
            <div className="flex items-center text-sm text-gray-400 mt-1">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              {formatDate(prompt.created_at)}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Switch
                checked={prompt.is_active}
                onCheckedChange={onActivate}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-purple-500/20"
            >
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
        <Separator className="bg-purple-500/10 my-3" />
        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-purple-500/10 max-h-[150px] overflow-y-auto">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">
            {searchQuery ? highlightText(prompt.prompt_text, searchQuery) : prompt.prompt_text}
          </p>
        </div>
      </div>
      <div className="bg-[#1E1E1E] px-5 py-3 border-t border-purple-500/10 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-purple-300 hover:text-white hover:bg-purple-500/20"
        >
          <Edit2 className="h-3.5 w-3.5 mr-1.5" />
          Edit Prompt
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </div>
    </div>
  )
}
