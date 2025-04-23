"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Edit, Trash2, Plus, Check, X, Settings, FileText, Sparkles } from "lucide-react"
import type { Prompt } from "@/types/prompt"
import { useToast } from "@/components/ui/use-toast"

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

  // Fetch all prompts when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPrompts()
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
        description: error instanceof Error ? error.message : "Failed to activate prompt. Please try again.",
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

  const activePrompts = prompts.filter((prompt) => prompt.is_active)
  const inactivePrompts = prompts.filter((prompt) => !prompt.is_active)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] p-0 bg-gradient-to-b from-[#1A1A1A] to-[#121212] text-white border border-purple-500/20 rounded-lg overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent flex items-center">
            <Settings className="h-5 w-5 mr-2 text-purple-400" />
            Prompt Management
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="w-full bg-[#252525] border-b border-purple-500/20">
              <TabsTrigger value="all" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white">
                All Prompts
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white"
              >
                Active Prompts
                {activePrompts.length > 0 && (
                  <Badge variant="outline" className="ml-2 bg-purple-500/20 text-white border-purple-500/30">
                    {activePrompts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="create"
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create New
              </TabsTrigger>
            </TabsList>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-purple-300">Loading prompts...</p>
              </div>
            </div>
          ) : (
            <>
              <TabsContent value="all" className="m-0">
                <ScrollArea className="h-[450px] px-6 py-4">
                  {prompts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
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
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {prompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onEdit={() => setEditingPrompt(prompt)}
                          onDelete={() => handleDeletePrompt(prompt.id)}
                          onActivate={() => handleActivatePrompt(prompt.id)}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="active" className="m-0">
                <ScrollArea className="h-[450px] px-6 py-4">
                  {activePrompts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Sparkles className="h-16 w-16 text-purple-500/30 mb-4" />
                      <h3 className="text-xl font-medium text-white mb-2">No active prompts</h3>
                      <p className="text-gray-400 max-w-md">
                        Activate a prompt to use it in your website generation process.
                      </p>
                      {prompts.length > 0 ? (
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
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activePrompts.map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          onEdit={() => setEditingPrompt(prompt)}
                          onDelete={() => handleDeletePrompt(prompt.id)}
                          onActivate={() => handleActivatePrompt(prompt.id)}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="create" className="m-0">
                <div className="px-6 py-4">
                  <Card className="bg-[#252525] border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">Create New Prompt</CardTitle>
                      <CardDescription className="text-gray-400">
                        Define a custom prompt to guide the AI in generating your website
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-prompt-name" className="text-white">
                          Prompt Name
                        </Label>
                        <Input
                          id="new-prompt-name"
                          value={newPromptName}
                          onChange={(e) => setNewPromptName(e.target.value)}
                          placeholder="E.g., E-commerce Site, Portfolio, Blog"
                          className="bg-[#333333] border-purple-500/30 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-prompt-text" className="text-white">
                          Prompt Text
                        </Label>
                        <Textarea
                          id="new-prompt-text"
                          value={newPromptText}
                          onChange={(e) => setNewPromptText(e.target.value)}
                          placeholder="Describe how you want the AI to generate your website..."
                          className="min-h-[200px] bg-[#333333] border-purple-500/30 text-white"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 border-t border-purple-500/20 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNewPromptName("")
                          setNewPromptText("")
                          setActiveTab("all")
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
                        Create Prompt
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
            </>
          )}

          {editingPrompt && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <Card className="w-[600px] bg-[#252525] border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Edit Prompt</CardTitle>
                  <CardDescription className="text-gray-400">Update your prompt details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-prompt-name" className="text-white">
                      Prompt Name
                    </Label>
                    <Input
                      id="edit-prompt-name"
                      value={editingPrompt.prompt_name}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt_name: e.target.value })}
                      placeholder="Enter prompt name"
                      className="bg-[#333333] border-purple-500/30 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-prompt-text" className="text-white">
                      Prompt Text
                    </Label>
                    <Textarea
                      id="edit-prompt-text"
                      value={editingPrompt.prompt_text}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt_text: e.target.value })}
                      placeholder="Enter prompt text"
                      className="min-h-[200px] bg-[#333333] border-purple-500/30 text-white"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 border-t border-purple-500/20 pt-4">
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
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </Tabs>

        <DialogFooter className="px-6 py-4 bg-[#1A1A1A] border-t border-purple-500/20">
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

interface PromptCardProps {
  prompt: Prompt
  onEdit: () => void
  onDelete: () => void
  onActivate: () => void
  formatDate: (date: string) => string
}

function PromptCard({ prompt, onEdit, onDelete, onActivate, formatDate }: PromptCardProps) {
  return (
    <Card className="bg-[#252525] border-purple-500/20 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-white flex items-center">
              {prompt.prompt_name}
              {prompt.is_active && <Badge className="ml-2 bg-purple-500 text-white border-none">Active</Badge>}
            </CardTitle>
            <CardDescription className="text-gray-400">Created: {formatDate(prompt.created_at)}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={prompt.is_active}
              onCheckedChange={onActivate}
              className="data-[state=checked]:bg-purple-600"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0 border-purple-500/30 text-white hover:bg-purple-500/20"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <Separator className="bg-purple-500/10" />
      <CardContent className="pt-4">
        <div className="bg-[#1A1A1A] p-3 rounded-md border border-purple-500/10 max-h-[120px] overflow-y-auto">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{prompt.prompt_text}</p>
        </div>
      </CardContent>
    </Card>
  )
}
