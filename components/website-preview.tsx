"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface WebsitePreviewProps {
  content: string
  directory: string
  isGenerating: boolean
  onTabActivated?: () => void
}

interface ProjectStatus {
  status: "running" | "stopped" | "exited"
  pid?: number
  port?: number
  message: string
  output?: string
  exit_code?: number
}

export default function WebsitePreview({ content, directory, isGenerating, onTabActivated }: WebsitePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isServerStarted, setIsServerStarted] = useState(false)
  const [serverPort, setServerPort] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false)
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | null>(null)

  // Update the checkProjectStatus function to handle the API error gracefully
  const checkProjectStatus = async () => {
    if (!directory) return null

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

            if (status.status === "running" && status.port) {
              setIsServerStarted(true)
              setServerPort(status.port)
              return status
            }
            return status
          }
        }
      }

      // Fall back to the old endpoint if needed
      response = await fetch(`/api/process-status/${directory}`)
      if (response.ok) {
        const data = await response.json()
        setProjectStatus(data)

        if (data.status === "running" && data.port) {
          setIsServerStarted(true)
          setServerPort(data.port)
          return data
        }
        return data
      }

      return null
    } catch (error) {
      console.error("Error checking project status:", error)
      return null
    }
  }

  // Modify the startServer function to check if server is already started
  const startServer = async () => {
    if (!directory || isGenerating) return

    try {
      setIsLoading(true)
      setError(null)

      // First check if the server is already running
      const status = await checkProjectStatus()

      if (status?.status === "running" && status.port) {
        // Server is already running
        setIsServerStarted(true)
        setServerPort(status.port)
        setIsLoading(false)
        return
      }

      // Call the start API to start the server for this project
      const response = await fetch("/api/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project_name: directory }), // Use original casing
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to start server: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === "success" && data.port) {
        setIsServerStarted(true)
        setServerPort(data.port)
      } else {
        throw new Error(data.message || "Failed to start server")
      }
    } catch (error) {
      console.error("Error starting server:", error)
      setError((error as Error).message || "Failed to start server")
    } finally {
      setIsLoading(false)
    }
  }

  // Check if content has been generated
  useEffect(() => {
    if (content && content !== "<!DOCTYPE html>\n<html>\n<head>\n  <title>Your Generated Website</title>") {
      setHasGeneratedContent(true)
    }
  }, [content])

  // Notify parent when this tab is activated
  useEffect(() => {
    // This effect runs when the component mounts, which means the tab is active
    if (onTabActivated) {
      onTabActivated()
    }

    // Check status and start server if needed, but ONLY if not generating
    if (directory && !isGenerating && !isServerStarted && !isLoading) {
      checkProjectStatus().then((status) => {
        if (!status || status.status !== "running") {
          startServer()
        }
      })
    }
  }, [])

  // Reset state when directory changes, but don't check status during generation
  useEffect(() => {
    setIsServerStarted(false)
    setServerPort(null)
    setError(null)

    // Check if the server for this directory is already running, but ONLY if not generating
    if (directory && !isGenerating) {
      checkProjectStatus()
    }
  }, [directory, isGenerating])

  // Handle iframe content for placeholder
  useEffect(() => {
    if (iframeRef.current && !isServerStarted && !hasGeneratedContent) {
      const iframe = iframeRef.current
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Website Preview</title>
            <style>
              body { 
                font-family: system-ui, sans-serif; 
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background-color: #0A090F;
                color: #f9fafb;
                background-image: 
                  radial-gradient(circle at center, rgba(139, 92, 246, 0.03) 0%, transparent 70%),
                  linear-gradient(rgba(139, 92, 246, 0.02) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(139, 92, 246, 0.02) 1px, transparent 1px);
                background-size: 100% 100%, 20px 20px, 20px 20px;
                background-position: center;
              }
              .content {
                text-align: center;
                padding: 2rem;
                animation: fadeIn 1s ease-out;
              }
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              h1 { 
                color: #f9fafb;
                font-size: 2rem;
                margin-bottom: 1rem;
                background: linear-gradient(to right, #f9fafb, #e2e8f0);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              }
              p { 
                color: #9ca3af;
                font-size: 1.1rem;
                line-height: 1.7;
              }
              .accent { 
                background: linear-gradient(90deg, #a855f7, #6366f1, #a855f7);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-size: 200% 100%;
                animation: gradientShift 8s linear infinite;
              }
              @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                100% { background-position: 200% 50%; }
              }
            </style>
          </head>
          <body>
            <div class="content">
              <h1>Preview Placeholder</h1>
              <p>Your website preview will appear here after generation is complete.</p>
              <p>The server will start automatically when content is ready.</p>
            </div>
          </body>
          </html>
        `)
        iframeDoc.close()
      }
    }
  }, [isServerStarted, hasGeneratedContent])

  // Add a flex-grow and min-width to ensure the preview maintains its size
  return (
    <div className="flex-1 flex-grow bg-background flex flex-col h-full min-w-0">
      <div className="flex items-center p-2 border-b border-border bg-[#13111C]">
        <div className="flex-1 mx-auto max-w-md">
          <div className="bg-background border border-input rounded-md px-3 py-1 text-sm text-center truncate">
            {isServerStarted ? `https://wegenweb.com/project/${directory}` : "preview.manufactura.ai"}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0A090F]/80 z-10">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 text-purple-400 animate-spin mb-2" />
              <p className="text-purple-200">Starting server...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0A090F]/80 z-10">
            <div className="bg-[#13111C] p-6 rounded-lg border border-red-500/30 max-w-md">
              <h3 className="text-red-400 font-medium mb-2">Error Starting Server</h3>
              <p className="text-gray-300 text-sm">{error}</p>
              <button
                onClick={startServer}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {isServerStarted && serverPort ? (
          <iframe
            src={`https://wegenweb.com/project/${directory}`}
            title="Website Preview"
            className="w-full h-full border-none"
            sandbox="allow-same-origin allow-scripts"
          />
        ) : (
          <iframe
            ref={iframeRef}
            title="Website Preview"
            className="w-full h-full border-none"
            sandbox="allow-same-origin allow-scripts"
          />
        )}
      </div>
    </div>
  )
}

