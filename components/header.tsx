"use client"

import { Moon, Sun, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import ProjectSelector from "@/components/project-selector"
import type { ProjectSummary } from "@/types/project"

interface HeaderProps {
  currentProject: ProjectSummary | null
  projects: ProjectSummary[]
  onSelectProject: (projectId: string) => void
  onNewProject: () => void
  onDeleteProject: (projectId: string) => void
  isGenerating?: boolean
}

interface ProjectStatus {
  status: "running" | "stopped" | "exited"
  pid?: number
  port?: number
  message: string
  output?: string
  exit_code?: number
}

export default function Header({
  currentProject,
  projects,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  isGenerating = false,
}: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | null>(null)

  // Ensure we don't check status during generation
  // Check project status only when the current project changes and not generating
  useEffect(() => {
    if (currentProject?.directory && !isGenerating) {
      checkProjectStatus(currentProject.directory)
    } else {
      setProjectStatus(null)
    }
    // No polling interval - only check when project changes and not generating
  }, [currentProject, isGenerating])

  // Function to check project status
  const checkProjectStatus = async (directory: string) => {
    try {
      // Try the new API endpoint format first
      let response = await fetch(`/api/projects`)

      if (response.ok) {
        const data = await response.json()
        if (data.projects && Array.isArray(data.projects)) {
          // Find the project with matching directory
          const projectData = data.projects.find((p: any) => p.name === directory)
          if (projectData) {
            // Convert to the expected format
            const status = {
              status: projectData.status || "stopped",
              pid: projectData.pid,
              port: projectData.port,
              message: projectData.status === "running" ? "Project is running" : "Project is stopped",
            }
            setProjectStatus(status)
            return status
          }
        }
      }

      // Fall back to the old endpoint if needed
      response = await fetch(`/api/process-status/${directory}`)
      if (response.ok) {
        const data = await response.json()
        setProjectStatus(data)
        return data
      }

      // If both fail, set a default status
      setProjectStatus({ status: "stopped", message: "Unable to determine project status" })
      return null
    } catch (error) {
      console.error("Error checking project status:", error)
      setProjectStatus({ status: "stopped", message: "Error checking status" })
      return null
    }
  }

  // Function to start the project
  const startProject = async () => {
    if (!currentProject?.directory) return null

    try {
      const response = await fetch("/api/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project_name: currentProject.directory }),
      })

      if (response.ok) {
        // Check status after starting
        const status = await checkProjectStatus(currentProject.directory)
        return status
      }
      return null
    } catch (error) {
      console.error("Error starting project:", error)
      return null
    }
  }

  // Determine if the preview button should be enabled
  const isPreviewEnabled = currentProject?.directory && (!isGenerating || projectStatus?.status === "running")

  // Handle preview button click
  const handlePreviewClick = () => {
    if (!currentProject?.directory) return

    // Simply open the project in a new tab without starting it
    window.open(`https://wegenweb.com/project/${currentProject.directory}`, "_blank")
  }

  return (
    <header className="border-b border-purple-900/20 bg-[#13111C] h-16 flex items-center px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-white animate-pulse-slow" />
        <h1 className="text-2xl font-bold tracking-tight text-white">manufactura.ai</h1>
      </div>

      <div className="ml-8">
        <ProjectSelector
          currentProject={currentProject}
          projects={projects}
          onSelectProject={onSelectProject}
          onNewProject={onNewProject}
          onDeleteProject={onDeleteProject}
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/10"
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button
          className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/20 rounded-xl px-6"
          onClick={handlePreviewClick}
          disabled={!isPreviewEnabled}
        >
          Preview
        </Button>
        <Button variant="ghost" size="icon" className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/10">
          <span className="sr-only">Settings</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-settings"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </Button>
      </div>
    </header>
  )
}

