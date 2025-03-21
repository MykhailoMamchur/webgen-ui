"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Plus, FolderOpen, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ProjectSummary } from "@/types/project"

interface ProjectSelectorProps {
  currentProject: ProjectSummary | null
  projects: ProjectSummary[]
  onSelectProject: (projectId: string) => void
  onNewProject: () => void
  onDeleteProject?: (projectId: string) => void
  isGenerating?: boolean
}

export default function ProjectSelector({
  currentProject,
  projects,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  isGenerating = false,
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative z-[9999]" ref={dropdownRef}>
      <Button
        variant="ghost"
        className={`flex items-center gap-2 text-white hover:bg-purple-500/10 px-3 py-2 h-auto ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={() => !isGenerating && setIsOpen(!isOpen)}
        disabled={isGenerating}
      >
        <span className="font-medium truncate max-w-[150px]">{currentProject?.name || "Select Project"}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && !isGenerating && (
        <div className="fixed top-[4rem] left-[8rem] mt-1 w-72 bg-[#13111C] border border-purple-900/20 rounded-lg shadow-lg z-[9999] py-2">
          <div className="px-3 py-2 border-b border-purple-900/20">
            <h3 className="text-sm font-medium text-gray-300">Your Projects</h3>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {projects.length > 0 ? (
              <div className="py-1">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-purple-500/10 cursor-pointer"
                    onClick={() => {
                      onSelectProject(project.id)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{project.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">
                          {project.description || "No description"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {onDeleteProject && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-1 text-gray-400 hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm("Are you sure you want to delete this project?")) {
                              onDeleteProject(project.id)
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-gray-400">No projects yet</p>
              </div>
            )}
          </div>

          <div className="px-3 py-2 border-t border-purple-900/20">
            <Button
              variant="ghost"
              className="w-full justify-start text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              onClick={() => {
                onNewProject()
                setIsOpen(false)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

