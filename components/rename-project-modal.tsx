"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface RenameProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onRenameProject: (newName: string) => Promise<void>
  currentName: string
}

export default function RenameProjectModal({ isOpen, onClose, onRenameProject, currentName }: RenameProjectModalProps) {
  const [name, setName] = useState(currentName)
  const [nameError, setNameError] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)

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

    if (value === currentName) {
      setNameError("New name must be different from current name")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateName(name)) {
      try {
        setIsRenaming(true)
        await onRenameProject(name)
        onClose()
      } catch (error) {
        console.error("Error renaming project:", error)
        // Error is handled in the parent component
      } finally {
        setIsRenaming(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#13111C] rounded-xl w-full max-w-md p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Rename Project</h2>
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
                autoFocus
              />
              {nameError && <p className="mt-1 text-sm text-red-400">{nameError}</p>}
              <p className="mt-1 text-xs text-gray-400">This will be used as the directory name.</p>
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
              disabled={!name.trim() || !!nameError || isRenaming}
            >
              {isRenaming ? (
                <>
                  <span className="mr-2">Renaming</span>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </>
              ) : (
                "Rename Project"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
