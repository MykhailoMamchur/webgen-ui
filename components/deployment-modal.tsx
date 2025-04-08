"use client"

import { useState, useEffect } from "react"
import { X, Rocket, Check, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DeploymentModalProps {
  isOpen: boolean
  onClose: () => void
  projectName: string
}

interface DeploymentAlias {
  project_name: string
  alias: string
}

export default function DeploymentModal({ isOpen, onClose, projectName }: DeploymentModalProps) {
  const [deploymentStatus, setDeploymentStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [deploymentAlias, setDeploymentAlias] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Add state to track if we're creating a deployment
  const [isCreatingDeployment, setIsCreatingDeployment] = useState<boolean>(false)

  // Update the useEffect to handle initial loading
  useEffect(() => {
    if (isOpen && projectName) {
      getDeploymentAlias()
    }
  }, [isOpen, projectName])

  // Update the getDeploymentAlias function to create a deployment if it fails
  const getDeploymentAlias = async () => {
    try {
      setDeploymentStatus("loading")
      setError(null)
      setIsCreatingDeployment(false)

      // Call the deployment/alias API
      const response = await fetch("/api/deployment/alias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project_name: projectName }),
      })

      // Check if the response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        // If alias check fails, try to create a deployment
        return createDeployment()
      }

      if (!response.ok) {
        const errorData = await response.json()
        // If alias check fails, try to create a deployment
        return createDeployment()
      }

      const data = (await response.json()) as DeploymentAlias

      if (data.alias) {
        setDeploymentAlias(data.alias)
        setDeploymentStatus("success")
      } else {
        // If no alias is returned, try to create a deployment
        return createDeployment()
      }
    } catch (error) {
      console.error("Error getting deployment alias:", error)
      // If any error occurs, try to create a deployment
      return createDeployment()
    }
  }

  // Add a function to create a deployment
  const createDeployment = async () => {
    try {
      setIsCreatingDeployment(true)
      setError(null)

      // Call the deployment creation API
      const response = await fetch("/api/deployment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project_name: projectName }),
      })

      // Check if the response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response from deployment creation:", text)
        throw new Error("Server returned an invalid response format")
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create deployment: ${response.status}`)
      }

      const data = await response.json()

      if (data.alias) {
        setDeploymentAlias(data.alias)
        setDeploymentStatus("success")
      } else {
        throw new Error("No alias returned from deployment creation")
      }
    } catch (error) {
      console.error("Error creating deployment:", error)
      setError((error as Error).message || "Failed to create deployment")
      setDeploymentStatus("error")
    } finally {
      setIsCreatingDeployment(false)
    }
  }

  const handleOpenDeployment = () => {
    if (deploymentAlias) {
      // Ensure the URL has https:// prefix
      const url = deploymentAlias.startsWith("http") ? deploymentAlias : `https://${deploymentAlias}`
      window.open(url, "_blank")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#13111C] border-purple-900/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Rocket className="h-5 w-5 text-purple-400" />
            Deployment Status
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-6">
          {deploymentStatus === "loading" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-10 w-10 text-purple-500 animate-spin mb-4" />
              <p className="text-gray-300 text-center">
                {isCreatingDeployment
                  ? "Creating deployment for " + projectName + "..."
                  : "Preparing deployment for " + projectName + "..."}
              </p>
            </div>
          )}

          {deploymentStatus === "error" && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <h3 className="text-red-400 font-medium mb-2">Deployment Error</h3>
              <p className="text-gray-300 text-sm">{error || "An unknown error occurred"}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={getDeploymentAlias}
                className="mt-4 border-red-500/30 text-red-300 hover:bg-red-900/20"
              >
                Retry
              </Button>
            </div>
          )}

          {deploymentStatus === "success" && (
            <div className="flex flex-col items-center">
              <div className="bg-green-900/20 border border-green-500/30 rounded-full p-3 mb-4">
                <Check className="h-8 w-8 text-green-400" />
              </div>

              <h3 className="text-xl font-medium text-white mb-2">Deployment Successful!</h3>
              <p className="text-gray-400 text-center mb-6">
                Your project has been successfully deployed and is now live.
              </p>

              <div className="w-full bg-background/30 border border-purple-900/20 rounded-md p-3 mb-6">
                <p className="text-sm text-gray-400 mb-1">Deployment URL:</p>
                <div className="flex items-center">
                  <span className="text-purple-300 font-mono text-sm truncate">
                    {deploymentAlias?.startsWith("http") ? deploymentAlias : `https://${deploymentAlias}`}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleOpenDeployment}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Deployment
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
