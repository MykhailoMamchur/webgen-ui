"use client"

import { useState, useEffect, useRef } from "react"
import { X, Check, ExternalLink, Loader2, Globe, Copy, ChevronRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import DomainSettingsModal from "./domain-settings-modal"

interface DeploymentModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

interface ExistingDeployment {
  deployment_url: string
  created_at: number
  updated_at: number
  domain: string | null
  domain_status: "DNS_PENDING" | "DNS_VERIFIED" | "PROVISIONED" | "PROVISION_ERROR" | "DELETING" | null
}

interface DeploymentStatus {
  status: "processing" | "completed" | "failed"
  [key: string]: any
}

// Add TierData interface if not already present
interface TierData {
  user_id: string
  tier_type: string
  edits_left: number
  renewal_at: number
}

export default function DeploymentModal({ isOpen, onClose, projectId, projectName }: DeploymentModalProps) {
  const [deploymentStatus, setDeploymentStatus] = useState<"idle" | "loading" | "polling" | "success" | "error">("idle")
  const [existingDeployment, setExistingDeployment] = useState<ExistingDeployment | null>(null)
  const [deploymentAlias, setDeploymentAlias] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false)
  const [isDeletingDomain, setIsDeletingDomain] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const initialLoadRef = useRef(true)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Add tier data state
  const [tierData, setTierData] = useState<TierData | null>(null)

  // Add function to fetch user tier data
  const fetchUserTierData = async () => {
    try {
      const response = await fetch("/api/user/tier", {
        method: "GET",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === "success" && data.tier_data) {
          setTierData(data.tier_data)
        }
      }
    } catch (error) {
      console.error("Error fetching user tier data:", error)
    }
  }

  // Add handleUpgrade function (same as in header)
  const handleUpgrade = async () => {
    try {
      // Fetch user data before redirecting
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch user data")
      }

      const fetchedUserData = await response.json()

      if (!fetchedUserData.email || !fetchedUserData.id) {
        throw new Error("User information is incomplete")
      }

      // Get current path for return URL
      const currentPath = window.location.pathname + window.location.search

      // Redirect to root domain with user data as URL parameters
      const subscribeUrl = new URL("https://usemanufactura.com/subscribe")
      subscribeUrl.searchParams.set("email", fetchedUserData.email)
      subscribeUrl.searchParams.set("userId", fetchedUserData.id)
      subscribeUrl.searchParams.set("returnUrl", `${window.location.origin}${currentPath}`)

      window.location.href = subscribeUrl.toString()
    } catch (error) {
      console.error("Error preparing upgrade:", error)
      // Fallback to external pricing page
      window.open("https://usemanufactura.com/pricing", "_blank")
    }
  }

  // Helper function to check if domain should be ignored
  const shouldIgnoreDomain = (deployment: ExistingDeployment | null) => {
    return !deployment?.domain || deployment.domain_status === "DELETING"
  }

  // Update the useEffect to handle initial loading and fetch tier data
  useEffect(() => {
    if (isOpen && projectId && initialLoadRef.current) {
      initialLoadRef.current = false
      checkExistingDeployment()
      fetchUserTierData() // Add this line
    }

    // Reset the ref when modal closes
    if (!isOpen) {
      initialLoadRef.current = true
      // Clear any polling intervals when modal closes
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [isOpen, projectId])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // Check if deployment already exists
  const checkExistingDeployment = async () => {
    try {
      setDeploymentStatus("loading")
      setError(null)

      // First, check if there's an existing deployment
      const response = await fetch(`/api/deployment?project_id=${projectId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Existing deployment found
        const data = await response.json()
        if (data.status === "success" && data.deployment) {
          setExistingDeployment(data.deployment)
          setDeploymentAlias(data.deployment.deployment_url)
          setDeploymentStatus("success")
          return
        }
      } else if (response.status === 404) {
        // No existing deployment, proceed with alias check and creation
        return getDeploymentAlias()
      } else {
        // Other error, try to proceed with creation anyway
        console.error("Error checking existing deployment:", await response.text())
        return getDeploymentAlias()
      }
    } catch (error) {
      console.error("Error checking existing deployment:", error)
      // If any error occurs, try to proceed with creation
      return getDeploymentAlias()
    }
  }

  // Check if deployment already exists (legacy flow)
  const getDeploymentAlias = async () => {
    try {
      setDeploymentStatus("loading")
      setError(null)

      // Call the deployment/alias API to check if deployment already exists
      const response = await fetch("/api/deployment/alias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
          alias_type: "prod",
        }),
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

  // Create a new deployment
  const createDeployment = async () => {
    try {
      setError(null)
      setDeploymentStatus("loading")

      // Call the deployment creation API
      const response = await fetch("/api/deployment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
        }),
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

      // After successful deployment creation, start polling for status
      setDeploymentStatus("polling")
      startPollingDeploymentStatus()
    } catch (error) {
      console.error("Error creating deployment:", error)
      setError((error as Error).message || "Failed to create deployment")
      setDeploymentStatus("error")
    }
  }

  // Poll deployment status
  const startPollingDeploymentStatus = () => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/deployment/status/${projectId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to get deployment status: ${response.status}`)
        }

        const data: DeploymentStatus = await response.json()

        if (data.status === "completed") {
          // Stop polling and get the final alias
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          await getFinalDeploymentAlias()
        } else if (data.status === "failed") {
          // Stop polling and show error
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          setError("Deployment failed. Please try again.")
          setDeploymentStatus("error")
        }
        // If status is "processing", continue polling
      } catch (error) {
        console.error("Error polling deployment status:", error)
        // Continue polling on error, but log it
      }
    }

    // Poll immediately, then every 15 seconds
    pollStatus()
    pollingIntervalRef.current = setInterval(pollStatus, 15000)
  }

  // Get the final deployment alias after completion
  const getFinalDeploymentAlias = async () => {
    try {
      const response = await fetch("/api/deployment/alias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
          alias_type: "prod",
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to get deployment alias: ${response.status}`)
      }

      const data = await response.json()

      if (data.alias) {
        setDeploymentAlias(data.alias)
        setDeploymentStatus("success")
      } else {
        throw new Error("No alias returned after deployment completion")
      }
    } catch (error) {
      console.error("Error getting final deployment alias:", error)
      setError((error as Error).message || "Failed to get deployment alias")
      setDeploymentStatus("error")
    }
  }

  const handleOpenDeployment = () => {
    const url =
      !shouldIgnoreDomain(existingDeployment) && existingDeployment?.domain
        ? `https://${existingDeployment.domain}`
        : existingDeployment?.deployment_url || deploymentAlias
    if (url) {
      // Ensure the URL has https:// prefix
      const finalUrl = url.startsWith("http") ? url : `https://${url}`
      window.open(finalUrl, "_blank")
    }
  }

  const handleCopyUrl = () => {
    const url =
      !shouldIgnoreDomain(existingDeployment) && existingDeployment?.domain
        ? `https://${existingDeployment.domain}`
        : existingDeployment?.deployment_url || deploymentAlias
    if (url) {
      const finalUrl = url.startsWith("http") ? url : `https://${url}`
      navigator.clipboard.writeText(finalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRedeploy = () => {
    // Reset state and trigger a new deployment
    setDeploymentStatus("loading")
    setExistingDeployment(null)
    setDeploymentAlias(null)
    setError(null)
    createDeployment()
  }

  const handleDomainSettings = () => {
    setIsDomainModalOpen(true)
  }

  const handleDeleteDomainClick = () => {
    setShowDeleteConfirmation(true)
  }

  const handleConfirmDeleteDomain = async () => {
    if (!existingDeployment?.domain || shouldIgnoreDomain(existingDeployment)) return

    try {
      setIsDeletingDomain(true)
      setShowDeleteConfirmation(false)

      const response = await fetch(`/api/deployment/domain?project_id=${projectId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Update the existing deployment to remove domain info
        setExistingDeployment((prev) =>
          prev
            ? {
                ...prev,
                domain: null,
                domain_status: null,
              }
            : null,
        )

        toast({
          title: "Domain removed",
          description: "Custom domain has been successfully removed from your deployment.",
        })
      } else if (response.status === 403) {
        toast({
          title: "Permission denied",
          description: "You don't have permission to delete this domain.",
          variant: "destructive",
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Failed to delete domain",
          description: errorData.error || "An error occurred while deleting the domain.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting domain:", error)
      toast({
        title: "Failed to delete domain",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingDomain(false)
    }
  }

  const getDomainStatusBadge = (status: string | null) => {
    if (!status || status === "DELETING") return null

    switch (status) {
      case "PROVISIONED":
        return (
          <Badge variant="default" className="bg-green-900/30 text-green-400 border-green-500/30 text-xs">
            Active
          </Badge>
        )
      case "DNS_VERIFIED":
        return (
          <Badge variant="default" className="bg-blue-900/30 text-blue-400 border-blue-500/30 text-xs">
            Connecting
          </Badge>
        )
      case "DNS_PENDING":
        return (
          <Badge variant="default" className="bg-yellow-900/30 text-yellow-400 border-yellow-500/30 text-xs">
            Pending
          </Badge>
        )
      case "PROVISION_ERROR":
        return (
          <Badge variant="destructive" className="bg-red-900/30 text-red-400 border-red-500/30 text-xs">
            Error
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-gray-900/30 text-gray-400 border-gray-500/30 text-xs">
            Unknown
          </Badge>
        )
    }
  }

  const displayUrl =
    !shouldIgnoreDomain(existingDeployment) && existingDeployment?.domain
      ? `https://${existingDeployment.domain}`
      : existingDeployment?.deployment_url || deploymentAlias

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md bg-[#0A090F] border-gray-800 p-0 overflow-hidden rounded-xl">
          {deploymentStatus === "loading" || deploymentStatus === "polling" ? (
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-medium text-white">Publishing</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white h-7 w-7"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-sm text-white font-medium">
                  {deploymentStatus === "loading" ? "Initializing" : "Building"}
                </span>
                <span className="text-sm text-gray-400 ml-1">{projectName}</span>
              </div>

              {deploymentStatus === "polling" && (
                <div className="mb-4">
                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                    <p className="text-sm text-amber-200">
                      Your website is being published. This process may take up to 10 minutes.
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-sm text-gray-400 mb-3">Settings</h3>

                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#13111C] border border-gray-800">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-white">Set a custom domain</span>
                  </div>
                  {tierData?.tier_type === "FREE" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUpgrade}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors hover:bg-emerald-500/20 h-7 px-2"
                    >
                      Upgrade Plan
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-7 px-2" disabled>
                      Configure
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </div>

              <Button
                className="w-full bg-[#13111C] hover:bg-[#1A1825] text-white border border-gray-800 h-9 text-sm"
                disabled
              >
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Publishing
              </Button>
            </div>
          ) : deploymentStatus === "error" ? (
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-medium text-white">Publication Error</h2>
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
                <p className="text-sm text-gray-300">{error || "An unknown error occurred during publication."}</p>
              </div>

              <Button
                onClick={handleRedeploy}
                className="w-full bg-[#13111C] hover:bg-[#1A1825] text-white border border-gray-800 h-9 text-sm"
              >
                Retry Publication
              </Button>
            </div>
          ) : deploymentStatus === "success" && displayUrl ? (
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-medium text-white">Publication Complete</h2>
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
                  <h3 className="text-sm text-white font-medium">Successfully published</h3>
                  <p className="text-sm text-gray-400">{projectName}</p>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-gray-400">Publication URL</h3>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenDeployment}
                      className="text-gray-400 hover:text-white h-7 w-7 p-0"
                      title="Open website"
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
                <div className="bg-[#13111C] border border-gray-800 rounded-lg p-2.5 font-mono text-sm text-purple-300 break-all">
                  {displayUrl.startsWith("http") ? displayUrl : `https://${displayUrl}`}
                </div>
              </div>

              <Separator className="bg-gray-800 my-5" />

              <div className="mb-5">
                <h3 className="text-sm text-gray-400 mb-3">Domain Settings</h3>

                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#13111C] border border-gray-800">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    {!shouldIgnoreDomain(existingDeployment) && existingDeployment?.domain ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">{existingDeployment.domain}</span>
                        {getDomainStatusBadge(existingDeployment.domain_status)}
                      </div>
                    ) : (
                      <span className="text-sm text-white">Set a custom domain</span>
                    )}
                  </div>
                  {!shouldIgnoreDomain(existingDeployment) && existingDeployment?.domain ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteDomainClick}
                      disabled={isDeletingDomain}
                      className="text-gray-400 hover:text-red-400 h-7 w-7 p-0"
                      title="Remove domain"
                    >
                      {isDeletingDomain ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  ) : tierData?.tier_type === "FREE" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUpgrade}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors hover:bg-emerald-500/20 h-7 px-2"
                    >
                      Upgrade Plan
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDomainSettings}
                      className="text-gray-400 hover:text-white h-7 px-2"
                    >
                      Configure
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </div>

              <Button
                onClick={handleRedeploy}
                className="w-full bg-[#13111C] hover:bg-[#1A1825] text-white border border-gray-800 h-9 text-sm"
              >
                Republish Website
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Domain Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-md bg-[#0A090F] border-gray-800">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-white text-base">Remove Custom Domain</DialogTitle>
                <DialogDescription className="text-gray-400 text-sm">This action cannot be undone.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Are you sure you want to remove{" "}
              <span className="font-medium text-white">{existingDeployment?.domain}</span> from your deployment? Your
              website will no longer be accessible from this custom domain.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirmation(false)}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDeleteDomain}
                disabled={isDeletingDomain}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeletingDomain ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove Domain"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DomainSettingsModal
        isOpen={isDomainModalOpen}
        onClose={() => setIsDomainModalOpen(false)}
        projectId={projectId}
        projectName={projectName}
      />
    </>
  )
}
