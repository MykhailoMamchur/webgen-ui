"use client"

import { Sparkles, ExternalLink, Upload } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import ProjectSelector from "@/components/project-selector"
import { AuthNav } from "@/components/auth-nav"
import type { ProjectSummary } from "@/types/project"

interface HeaderProps {
  currentProject: ProjectSummary | null
  projects: ProjectSummary[]
  onSelectProject: (projectId: string) => void
  onNewProject: () => void
  onDeleteProject: (projectId: string) => Promise<void>
  onRenameProject?: (projectId: string, newName: string) => void
  isGenerating?: boolean
  onDeploy?: () => void
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
  onDeploy,
}: HeaderProps) {
  const [deploymentAlias, setDeploymentAlias] = useState<string | null>(null)
  const [isLoadingAlias, setIsLoadingAlias] = useState(false)
  // Add an error state to track deployment alias failures
  const [deploymentError, setDeploymentError] = useState<boolean>(false)

  // Check for deployment alias when the current project changes
  useEffect(() => {
    if (currentProject?.directory && !isGenerating) {
      getDeploymentAlias(currentProject.directory)
    } else {
      setDeploymentAlias(null)
    }
  }, [currentProject, isGenerating])

  // Update the getDeploymentAlias function to handle errors properly
  const getDeploymentAlias = async (directory: string) => {
    try {
      setIsLoadingAlias(true)
      setDeploymentError(false)

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
        setDeploymentError(true)
        throw new Error("Server returned an invalid response format")
      }

      if (response.ok) {
        const data = (await response.json()) as DeploymentAlias
        if (data.alias) {
          setDeploymentAlias(data.alias)
        } else {
          setDeploymentError(true)
          throw new Error("No alias returned from deployment service")
        }
      } else {
        const errorData = await response.json()
        setDeploymentError(true)
        throw new Error(errorData.error || `Failed to get deployment alias: ${response.status}`)
      }
    } catch (error) {
      console.error("Error getting deployment alias:", error)
      setDeploymentAlias(null)
      setDeploymentError(true)
    } finally {
      setIsLoadingAlias(false)
    }
  }

  // Update the isPreviewEnabled condition to check for deployment errors
  const isPreviewEnabled =
    currentProject?.directory && !isLoadingAlias && ((!isGenerating && !deploymentError) || deploymentAlias !== null)

  // Handle preview button click
  const handlePreviewClick = () => {
    if (!currentProject?.directory) return

    if (deploymentAlias) {
      // Ensure the URL has https:// prefix
      const url = deploymentAlias.startsWith("http") ? deploymentAlias : `https://${deploymentAlias}`
      window.open(url, "_blank")
    } else {
      // If we don't have an alias yet, try to get one and then open it
      getDeploymentAlias(currentProject.directory).then(() => {
        if (deploymentAlias) {
          const url = deploymentAlias.startsWith("http") ? deploymentAlias : `https://${deploymentAlias}`
          window.open(url, "_blank")
        }
      })
    }
  }

  return (
    <header className="border-b border-purple-900/20 bg-[#13111C] h-16 flex items-center px-6 sticky top-0 z-10">
      <div className="flex items-center">
        <div className="flex items-center gap-2 mr-8">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h1 className="text-xl font-semibold tracking-tight text-white">manufactura.ai</h1>
        </div>

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

      <div className="ml-auto flex items-center gap-3">
        <AuthNav />

        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviewClick}
          disabled={!isPreviewEnabled}
          className="bg-background/30 border-purple-500/30 text-purple-100 hover:bg-purple-500/20 hover:text-white"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Preview
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onDeploy}
          disabled={!currentProject || isGenerating}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
        >
          <Upload className="h-4 w-4 mr-2" />
          Deploy
        </Button>
      </div>
    </header>
  )
}
