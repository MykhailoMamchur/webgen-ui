"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Edit, Trash2, Plus, Check, X } from "lucide-react"
import type { Prompt } from "@/types/prompt"
import { useToast } from "@/components/ui/use-toast"
import { getAuthToken } from "@/lib/auth"

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

  // Fetch all prompts when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPrompts()
    }
  }, [isOpen])

  const fetchPrompts = async () => {
    try {
      setLoading(true)
      const token = getAuthToken()

      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required. Please log in again.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/prompts/get_all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch prompts")
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
        description: "Failed to load prompts. Please try again.",
        variant: "destructive",
      })
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
      const token = getAuthToken()

      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required. Please log in again.",
          variant: "destructive",
        })
        return
      }

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
        throw new Error("Failed to create prompt")
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
        fetchPrompts()
      } else {
        throw new Error(data.message || "Failed to create prompt")
      }
    } catch (error) {
      console.error("Error creating prompt:", error)
      toast({
        title: "Error",
        description: "Failed to create prompt. Please try again.",
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
      const token = getAuthToken()

      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required. Please log in again.",
          variant: "destructive",
        })
        return
      }

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
        throw new Error("Failed to update prompt")
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
        description: "Failed to update prompt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) {
      return
    }

    try {
      const token = getAuthToken()

      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required. Please log in again.",
          variant: "destructive",
        })
        return
      }

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
        throw new Error("Failed to delete prompt")
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
        description: "Failed to delete prompt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleActivatePrompt = async (promptId: string) => {
    try {
      const token = getAuthToken()

      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required. Please log in again.",
          variant: "destructive",
        })
        return
      }

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
        throw new Error("Failed to activate prompt")
      }

      const data = await response.json()
      if (data.status === "success") {
        toast({
          title: "Success",
          description: "Prompt activated successfully.",
        })
        fetchPrompts()
      } else {
        throw new Error(data.message || "Failed to activate prompt")
      }
    } catch (error) {
      console.error("Error activating prompt:", error)
      toast({
        title: "Error",
        description: "Failed to activate prompt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString()
    } catch (error) {
      return dateString
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-[#1A1A1A] text-white border-purple-900/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Manage Prompts</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {/* Create/Edit Prompt Form */}
            {isCreating ? (
              <div className="space-y-4 mb-6 p-4 bg-[#252525] rounded-md">
                <h3 className="text-lg font-medium">Create New Prompt</h3>
                <div className="space-y-2">
                  <Label htmlFor="new-prompt-name">Prompt Name</Label>
                  <Input
                    id="new-prompt-name"
                    value={newPromptName}
                    onChange={(e) => setNewPromptName(e.target.value)}
                    placeholder="Enter prompt name"
                    className="bg-[#333333] border-purple-900/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-prompt-text">Prompt Text</Label>
                  <Textarea
                    id="new-prompt-text"
                    value={newPromptText}
                    onChange={(e) => setNewPromptText(e.target.value)}
                    placeholder="Enter prompt text"
                    className="min-h-[100px] bg-[#333333] border-purple-900/30"
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false)
                      setNewPromptName("")
                      setNewPromptText("")
                    }}
                    className="border-purple-500/30 text-white hover:bg-purple-500/20"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePrompt}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </div>
              </div>
            ) : editingPrompt ? (
              <div className="space-y-4 mb-6 p-4 bg-[#252525] rounded-md">
                <h3 className="text-lg font-medium">Edit Prompt</h3>
                <div className="space-y-2">
                  <Label htmlFor="edit-prompt-name">Prompt Name</Label>
                  <Input
                    id="edit-prompt-name"
                    value={editingPrompt.prompt_name}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt_name: e.target.value })}
                    placeholder="Enter prompt name"
                    className="bg-[#333333] border-purple-900/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-prompt-text">Prompt Text</Label>
                  <Textarea
                    id="edit-prompt-text"
                    value={editingPrompt.prompt_text}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt_text: e.target.value })}
                    placeholder="Enter prompt text"
                    className="min-h-[100px] bg-[#333333] border-purple-900/30"
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setEditingPrompt(null)}
                    className="border-purple-500/30 text-white hover:bg-purple-500/20"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdatePrompt}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setIsCreating(true)}
                className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Prompt
              </Button>
            )}

            {/* Prompts List */}
            <div className="space-y-4">
              {prompts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No prompts found. Create your first prompt to get started.
                </div>
              ) : (
                prompts.map((prompt) => (
                  <div key={prompt.id} className="p-4 bg-[#252525] rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-medium">{prompt.prompt_name}</h3>
                        <p className="text-sm text-gray-400">Created: {formatDate(prompt.created_at)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={prompt.is_active}
                            onCheckedChange={() => handleActivatePrompt(prompt.id)}
                            className="data-[state=checked]:bg-purple-600"
                          />
                          <span className="text-sm">{prompt.is_active ? "Active" : "Inactive"}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPrompt(prompt)}
                          className="h-8 w-8 p-0 border-purple-500/30 text-white hover:bg-purple-500/20"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePrompt(prompt.id)}
                          className="h-8 w-8 p-0 border-red-500/30 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                    <Separator className="my-2 bg-purple-900/20" />
                    <div className="mt-2">
                      <p className="text-sm whitespace-pre-wrap">{prompt.prompt_text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-purple-500/30 text-white hover:bg-purple-500/20"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
