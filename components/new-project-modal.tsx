"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (name: string, description: string) => void
}

export default function NewProjectModal({ isOpen, onClose, onCreateProject }: NewProjectModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [nameError, setNameError] = useState("")

  if (!isOpen) return null

  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError("Project name is required")
      return false
    }

    if (/\s/.test(value)) {
      setNameError("Project name cannot contain spaces. Use hyphens instead.")
      return false
    }

    setNameError("")
    return true
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Replace spaces with hyphens as the user types
    const formattedValue = value.replace(/\s+/g, "-")
    setName(formattedValue)
    validateName(formattedValue)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateName(name)) {
      onCreateProject(name, description)
      setName("")
      setDescription("")
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#13111C] rounded-xl w-full max-w-md p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">New Project</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-gray-300 mb-1">
                Project Name
              </label>
              <Input
                id="project-name"
                value={name}
                onChange={handleNameChange}
                placeholder="my-awesome-website"
                className="bg-[#0A090F] border-purple-900/20 focus-visible:ring-purple-500/30"
                required
              />
              {nameError && <p className="mt-1 text-sm text-red-400">{nameError}</p>}
              <p className="mt-1 text-xs text-gray-400">
                Use hyphens instead of spaces. This will be used as the directory name.
              </p>
            </div>

            <div>
              <label htmlFor="project-description" className="block text-sm font-medium text-gray-300 mb-1">
                Description (optional)
              </label>
              <Textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your project"
                className="bg-[#0A090F] border-purple-900/20 focus-visible:ring-purple-500/30 min-h-[100px]"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-purple-900/20 text-gray-300 hover:bg-purple-500/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white"
              disabled={!name.trim() || !!nameError}
            >
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

