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
  onDeleteProject: (projectId: string) => Promise<void>
  onRenameProject?: (projectId: string, newName: string) => void
  isGenerating?: boolean
}

interface DeploymentAlias {
  project_name: string
  alias: string
}

export default function Header({
  currentProject,
  projects,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onRenameProject,
  isGenerating = false,
}: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [deploymentAlias, setDeploymentAlias] = useState<string | null>(null)
  const [isLoadingAlias, setIsLoadingAlias] = useState(false)

  // Check for deployment alias when the current project changes
  useEffect(() => {
    if (currentProject?.directory && !isGenerating) {
      getDeploymentAlias(currentProject.directory)
    } else {
      setDeploymentAlias(null)
    }
  }, [currentProject, isGenerating])

  // Function to get deployment alias
  const getDeploymentAlias = async (directory: string) => {
    try {
      setIsLoadingAlias(true)

      const response = await fetch("/api/deployment/alias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project_name: directory }),
      })

      // Check if the response is JSON before trying to parse it
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        // If not JSON, get the text and log it for debugging
        const text = await response.text()
        console.error("Non-JSON response:", text)
        throw new Error("Server returned an invalid response format")
      }

      if (response.ok) {
        const data = (await response.json()) as DeploymentAlias
        if (data.alias) {
          setDeploymentAlias(data.alias)
        } else {
          throw new Error("No alias returned from deployment service")
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to get deployment alias: ${response.status}`)
      }
    } catch (error) {
      console.error("Error getting deployment alias:", error)
      setDeploymentAlias(null)
    } finally {
      setIsLoadingAlias(false)
    }
  }

  // Determine if the preview button should be enabled
  const isPreviewEnabled = currentProject?.directory && !isLoadingAlias && (!isGenerating || deploymentAlias !== null)

  // Handle preview button click
  const handlePreviewClick = () => {
    if (!currentProject?.directory) return

    if (deploymentAlias) {
      // Open the deployment alias URL
      window.open(deploymentAlias, "_blank")
    } else {
      // If we don't have an alias yet, try to get one and then open it
      getDeploymentAlias(currentProject.directory).then(() => {
        if (deploymentAlias) {
          window.open(deploymentAlias, "_blank")
        }
      })
    }
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
          onRenameProject={onRenameProject}
          isGenerating={isGenerating}
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
          {isLoadingAlias ? (
            <>
              <span className="mr-2">Loading</span>
              <span className="animate-pulse">...</span>
            </>
          ) : (
            "Preview"
          )}
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
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.08a2 2 0 0 1 1 1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </Button>
      </div>
    </header>
  )
}

