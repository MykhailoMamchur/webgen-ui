"use client"

import { useState, useEffect } from "react"
import { Play, Square, RefreshCw, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProjectDeployment {
  name: string
  status: "running" | "stopped"
  port: number | null
}

export default function DeploymentsTab() {
  const [deployments, setDeployments] = useState<ProjectDeployment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDeployments = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/projects")

      if (!response.ok) {
        throw new Error(`Failed to fetch deployments: ${response.status}`)
      }

      // The API now directly returns projects with their status
      const data = await response.json()
      setDeployments(data.projects)
    } catch (error) {
      console.error("Error fetching deployments:", error)
      setError((error as Error).message || "Failed to fetch deployments")
    } finally {
      setIsLoading(false)
    }
  }

  // Only fetch deployments when the component mounts
  useEffect(() => {
    fetchDeployments()
    // No polling interval - only fetch when tab is opened or refresh is clicked
  }, [])

  const startProject = async (projectName: string) => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project_name: projectName }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to start project: ${response.status}`)
      }

      // Refresh deployments after starting
      await fetchDeployments()
    } catch (error) {
      console.error("Error starting project:", error)
      setError((error as Error).message || "Failed to start project")
    } finally {
      setIsLoading(false)
    }
  }

  const stopProject = async (projectName: string) => {
    try {
      setIsLoading(true)

      // Updated to use the new API endpoint format
      const response = await fetch(`/api/stop/${projectName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to stop project: ${response.status}`)
      }

      // Refresh deployments after stopping
      await fetchDeployments()
    } catch (error) {
      console.error("Error stopping project:", error)
      setError((error as Error).message || "Failed to stop project")
    } finally {
      setIsLoading(false)
    }
  }

  const stopAllProjects = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/stop-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to stop all projects: ${response.status}`)
      }

      // Refresh deployments after stopping all
      await fetchDeployments()
    } catch (error) {
      console.error("Error stopping all projects:", error)
      setError((error as Error).message || "Failed to stop all projects")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 bg-[#0A090F] flex flex-col h-full overflow-hidden">
      <div className="sticky top-0 z-[5] bg-[#0A090F] border-b border-purple-900/20 p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium text-white">Active Deployments</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDeployments}
            disabled={isLoading}
            className="border-purple-900/20 text-purple-300 hover:bg-purple-500/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={stopAllProjects}
            disabled={isLoading || deployments.filter((d) => d.status === "running").length === 0}
            className="border-red-900/20 text-red-300 hover:bg-red-500/10"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop All
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 m-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="p-4 overflow-auto">
        {deployments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {isLoading ? "Loading deployments..." : "No projects found"}
          </div>
        ) : (
          <div className="grid gap-4">
            {deployments.map((deployment) => (
              <div
                key={deployment.name}
                className="bg-[#13111C] rounded-lg border border-purple-900/20 overflow-hidden"
              >
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-white">{deployment.name}</h3>
                    <div className="flex items-center mt-1">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          deployment.status === "running" ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                      <span className="text-sm text-gray-300">
                        {deployment.status === "running" ? `Running on port ${deployment.port}` : "Stopped"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {deployment.status === "running" ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/api/project/${deployment.name}`, "_blank")}
                          className="border-purple-900/20 text-purple-300 hover:bg-purple-500/10"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => stopProject(deployment.name)}
                          disabled={isLoading}
                          className="border-red-900/20 text-red-300 hover:bg-red-500/10"
                        >
                          <Square className="h-4 w-4 mr-2" />
                          Stop
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startProject(deployment.name)}
                        disabled={isLoading}
                        className="border-green-900/20 text-green-300 hover:bg-green-500/10"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

