"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, Globe, Copy, Check, AlertCircle, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface DomainSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
}

interface DomainSetupResponse {
  dns_ns_records: string[]
  domain: string
  status: string
}

interface DeploymentResponse {
  status: "success"
  deployment: {
    deployment_url: string
    created_at: number
    updated_at: number
    domain: string | null
    domain_status: "DNS_PENDING" | "DNS_VERIFIED" | "PROVISIONED" | "PROVISION_ERROR" | "DELETING" | null
  }
}

export default function DomainSettingsModal({ isOpen, onClose, projectId, projectName }: DomainSettingsModalProps) {
  const [domain, setDomain] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameservers, setNameservers] = useState<string[]>([])
  const [setupComplete, setSetupComplete] = useState(false)
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null)
  const [currentDomain, setCurrentDomain] = useState<string>("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [domainStatus, setDomainStatus] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup polling when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const handleDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!domain.trim()) return

    setIsLoading(true)
    setError(null)
    setNameservers([])
    setSetupComplete(false)

    try {
      const response = await fetch("/api/deployment/domain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
          domain: domain.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to setup domain")
      }

      const data: DomainSetupResponse = await response.json()
      setNameservers(data.dns_ns_records || [])
      setCurrentDomain(domain.trim())
      setSetupComplete(true)
    } catch (error) {
      console.error("Error setting up domain:", error)
      setError((error as Error).message || "Failed to setup domain")
    } finally {
      setIsLoading(false)
    }
  }

  const startDomainStatusPolling = () => {
    const pollDomainStatus = async () => {
      try {
        const response = await fetch(`/api/deployment?project_id=${projectId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data: DeploymentResponse = await response.json()
          if (data.status === "success" && data.deployment) {
            const newStatus = data.deployment.domain_status
            setDomainStatus(newStatus)

            if (newStatus === "PROVISIONED") {
              // Success! Stop polling and show success state
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
              }
              setIsProvisioning(false)
              setIsSuccess(true)
            } else if (newStatus === "PROVISION_ERROR") {
              // Error occurred, stop polling and show error
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current)
                pollingIntervalRef.current = null
              }
              setIsProvisioning(false)
              setError("Domain provisioning failed. Please check your DNS settings and try again.")
            }
            // For other statuses (DNS_PENDING, DNS_VERIFIED), continue polling
          }
        }
      } catch (error) {
        console.error("Error polling domain status:", error)
        // Continue polling on error, but log it
      }
    }

    // Poll immediately, then every 15 seconds
    pollDomainStatus()
    pollingIntervalRef.current = setInterval(pollDomainStatus, 15000)
  }

  const handleVerifyDomain = async () => {
    if (!currentDomain) return

    setIsVerifying(true)
    setError(null)

    try {
      const response = await fetch("/api/deployment/domain/provision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
          domain: currentDomain,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 400) {
          // Switch back to DNS records screen and show error
          setIsVerifying(false)
          setError("DNS records not verified. Please ensure all nameservers are properly configured and try again.")
          return
        }
        throw new Error(errorData.error || "Failed to provision domain")
      }

      const data = await response.json()

      // Check if the response indicates scheduling was successful
      if (data.status === "scheduled") {
        // Success - start polling for domain status
        setIsVerifying(false)
        setIsProvisioning(true)
        startDomainStatusPolling()
      } else {
        // Unexpected response
        setIsVerifying(false)
        setError("Unexpected response from server. Please try again.")
      }
    } catch (error) {
      console.error("Error provisioning domain:", error)
      setIsVerifying(false)
      setError((error as Error).message || "Failed to provision domain")
    }
  }

  const handleCopyNameserver = (nameserver: string) => {
    navigator.clipboard.writeText(nameserver)
    setCopiedRecord(nameserver)
    setTimeout(() => setCopiedRecord(null), 2000)
  }

  const handleReset = () => {
    // Clear polling when resetting
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    setDomain("")
    setCurrentDomain("")
    setNameservers([])
    setSetupComplete(false)
    setError(null)
    setIsProvisioning(false)
    setIsVerifying(false)
    setIsSuccess(false)
    setDomainStatus(null)
  }

  const getDomainStatusText = (status: string | null) => {
    switch (status) {
      case "DNS_PENDING":
        return "DNS Pending"
      case "DNS_VERIFIED":
        return "DNS Verified"
      case "PROVISIONED":
        return "Provisioned"
      case "PROVISION_ERROR":
        return "Provision Error"
      default:
        return "Processing"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-[#0A090F] border-gray-800 p-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-5 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-medium text-white flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Custom Domain Settings
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white h-7 w-7">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-sm text-gray-400 mt-1">Configure a custom domain for {projectName}</p>
        </DialogHeader>

        <div className="p-5 pt-3">
          {!setupComplete ? (
            <form onSubmit={handleDomainSubmit} className="space-y-4">
              <div>
                <Label htmlFor="domain" className="text-sm text-gray-400 mb-2 block">
                  Domain Name
                </Label>
                <Input
                  id="domain"
                  type="text"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="bg-[#13111C] border-gray-800 text-white placeholder-gray-500 focus:border-purple-500"
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500 mt-1">Enter your domain name without "www" or "https://"</p>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={!domain.trim() || isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white h-9 text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Setting up domain...
                  </>
                ) : (
                  "Setup Domain"
                )}
              </Button>
            </form>
          ) : isProvisioning ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-full bg-amber-900 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
                </div>
                <div>
                  <h3 className="text-sm text-white font-medium">Provisioning Domain</h3>
                  <p className="text-sm text-gray-400">{currentDomain}</p>
                  {domainStatus && (
                    <p className="text-xs text-gray-500 mt-1">Status: {getDomainStatusText(domainStatus)}</p>
                  )}
                </div>
              </div>

              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                <p className="text-sm text-amber-200">
                  Your custom domain is being provisioned. This process may take up to 10 minutes to complete.
                </p>
              </div>

              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full border-gray-800 text-gray-300 hover:text-white h-9 text-sm"
              >
                Configure Another Domain
              </Button>
            </div>
          ) : isSuccess ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-full bg-green-900 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm text-white font-medium">Domain Successfully Configured</h3>
                  <p className="text-sm text-gray-400">{currentDomain}</p>
                </div>
              </div>

              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                <p className="text-sm text-green-200">
                  Your custom domain has been successfully configured and is now live! You can access your project at{" "}
                  {currentDomain}.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(`https://${currentDomain}`, "_blank")}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 text-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  Visit Domain
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-gray-800 text-gray-300 hover:text-white h-9 px-3"
                >
                  Configure Another
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm text-white font-medium">Nameserver Configuration</h3>
                  <p className="text-sm text-gray-400">Update your domain's nameservers to these values</p>
                </div>
                <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                  {currentDomain}
                </Badge>
              </div>

              <div className="space-y-2">
                {nameservers.map((nameserver, index) => (
                  <div key={index} className="bg-[#13111C] border border-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-gray-800 text-gray-300 text-sm">
                          NS {index + 1}
                        </Badge>
                        <span className="text-white font-mono text-base">{nameserver}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyNameserver(nameserver)}
                        className="text-gray-400 hover:text-white h-6 w-6 p-0"
                        title="Copy nameserver"
                      >
                        {copiedRecord === nameserver ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm text-blue-300 font-medium">Nameserver Update Instructions</p>
                    <p className="text-sm text-blue-200">
                      1. Log in to your domain registrar (GoDaddy, Namecheap, etc.)
                      <br />
                      2. Find the "Nameservers" or "DNS" settings for your domain
                      <br />
                      3. Replace the existing nameservers with the ones listed above
                      <br />
                      4. Save the changes and wait for propagation (up to 24 hours)
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <Separator className="bg-gray-800" />

              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyDomain}
                  disabled={isVerifying}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 text-sm"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Continuing...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-gray-800 text-gray-300 hover:text-white h-9 px-3"
                >
                  Reset
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ExternalLink className="h-3 w-3" />
                <span>Need help? Contact your domain registrar for nameserver update instructions.</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
