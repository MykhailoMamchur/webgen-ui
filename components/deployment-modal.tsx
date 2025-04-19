"use client"

import { useState, useEffect } from "react"
import { X, Check, ExternalLink, Loader2, Globe, Copy, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface DeploymentModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

interface DeploymentAlias {
  project_name: string
  alias: string
}

export default function DeploymentModal({ isOpen, onClose, projectId, projectName }: DeploymentModalProps) {
  const [deploymentStatus, setDeploymentStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [deploymentAlias, setDeploymentAlias] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingDeployment, setIsCreatingDeployment] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  // Update the useEffect to handle initial loading
  useEffect(() => {
    if (isOpen && projectId) {
      getDeploymentAlias()
    }
  }, [isOpen, projectId])

  // Update the getDeploymentAlias function to use projectId
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
        body: JSON.stringify({ project_id: projectId }),
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
        console.error("Error checking alias:", errorData)
        // If alias check fails, try to create a deployment
        return createDeployment()
      }

      const data = await response.json()

      if (data.alias) {
        setDeploymentAlias(data.alias)
        setDeploymentStatus("success")
      } else {
        console.error("No alias in response:", data)
        // If no alias is returned, try to create a deployment
        return createDeployment()
      }
    } catch (error) {
      console.error("Error getting deployment alias:", error)
      // If any error occurs, try to create a deployment
      return createDeployment()
    }
  }

  // Update the createDeployment function to use projectId
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
        body: JSON.stringify({ project_id: projectId }),
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

      // After successful deployment creation, check for the alias again
      return checkDeploymentAlias()
    } catch (error) {
      console.error("Error creating deployment:", error)
      setError((error as Error).message || "Failed to create deployment")
      setDeploymentStatus("error")
    } finally {
      setIsCreatingDeployment(false)
    }
  }

  // Update the checkDeploymentAlias function to use projectId
  const checkDeploymentAlias = async () => {
    try {
      // Wait a moment to ensure the deployment has been processed
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Call the deployment/alias API again
      const response = await fetch("/api/deployment/alias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project_id: projectId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to get deployment alias: ${response.status}`)
      }

      const data = await response.json()

      if (data.alias) {
        setDeploymentAlias(data.alias)
        setDeploymentStatus("success")
      } else {
        throw new Error("No alias returned after deployment creation")
      }
    } catch (error) {
      console.error("Error checking deployment alias after creation:", error)
      setError((error as Error).message || "Failed to get deployment alias")
      setDeploymentStatus("error")
    }
  }

  const handleOpenDeployment = () => {
    if (deploymentAlias) {
      // Ensure the URL has https:// prefix
      const url = deploymentAlias.startsWith("http") ? deploymentAlias : `https://${deploymentAlias}`
      window.open(url, "_blank")
    }
  }

  const handleCopyUrl = () => {
    if (deploymentAlias) {
      const url = deploymentAlias.startsWith("http") ? deploymentAlias : `https://${deploymentAlias}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0A090F] border-gray-800 p-0 overflow-hidden rounded-xl">
        {deploymentStatus === "loading" ? (
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-medium text-white">Deploying</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute right-3 top-3 text-gray-400 hover:text-white h-7 w-7"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm text-white font-medium">Building</span>
              <span className="text-xs text-gray-400 ml-1">{projectName}</span>
            </div>

            <div className="mb-5">
              <h3 className="text-xs text-gray-400 mb-3">Settings</h3>

              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#13111C] border border-gray-800">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-white">Set a custom domain</span>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-7 px-2" disabled>
                  Configure
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>

            <Button
              className="w-full bg-[#13111C] hover:bg-[#1A1825] text-white border border-gray-800 h-9 text-sm"
              disabled
            >
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              Deploying
            </Button>
          </div>
        ) : deploymentStatus === "error" ? (
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-medium text-white">Deployment Error</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute right-3 top-3 text-gray-400 hover:text-white h-7 w-7"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-5">
              <p className="text-sm text-gray-300">{error || "An unknown error occurred during deployment."}</p>
            </div>

            <Button
              onClick={getDeploymentAlias}
              className="w-full bg-[#13111C] hover:bg-[#1A1825] text-white border border-gray-800 h-9 text-sm"
            >
              Retry Deployment
            </Button>
          </div>
        ) : deploymentStatus === "success" && deploymentAlias ? (
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-medium text-white">Deployment Complete</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute right-3 top-3 text-gray-400 hover:text-white h-7 w-7"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-full bg-green-900 flex items-center justify-center">
                <Check className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <h3 className="text-sm text-white font-medium">Successfully deployed</h3>
                <p className="text-xs text-gray-400">{projectName}</p>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs text-gray-400">Deployment URL</h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenDeployment}
                    className="text-gray-400 hover:text-white h-7 w-7 p-0"
                    title="Open deployment"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyUrl}
                    className="text-gray-400 hover:text-white h-7 w-7 p-0"
                    title="Copy URL"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="bg-[#13111C] border border-gray-800 rounded-lg p-2.5 font-mono text-xs text-purple-300 break-all">
                {deploymentAlias.startsWith("http") ? deploymentAlias : `https://${deploymentAlias}`}
              </div>
            </div>

            <Separator className="bg-gray-800 my-5" />

            <div className="mb-5">
              <h3 className="text-xs text-gray-400 mb-3">Domain Settings</h3>

              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#13111C] border border-gray-800">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-white">Set a custom domain</span>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-7 px-2">
                  Configure
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
