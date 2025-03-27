"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
// Add imports for the selection mode button
import { Pointer, X } from "lucide-react"

// Update the WebsitePreviewProps interface to include selected elements
interface WebsitePreviewProps {
  content: string
  directory: string
  isGenerating: boolean
  onTabActivated?: () => void
  onElementsSelected?: (elements: SelectedElement[]) => void
}

// Add a new interface for selected elements
interface SelectedElement {
  selector: string
  html: string
}

interface ProjectStatus {
  status: "running" | "stopped" | "exited"
  pid?: number
  port?: number
  message: string
  output?: string
  exit_code?: number
}

// Update the WebsitePreview component to include selection mode
export default function WebsitePreview({
  content,
  directory,
  isGenerating,
  onTabActivated,
  onElementsSelected,
}: WebsitePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isServerStarted, setIsServerStarted] = useState(false)
  const [serverPort, setServerPort] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false)
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | null>(null)
  // Add state for selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([])
  const [iframeLoaded, setIframeLoaded] = useState(false)

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

  // Add this useEffect to inject the selection script when the server starts

  // Add a function to toggle selection mode
  const toggleSelectionMode = () => {
    if (!iframeRef.current || !iframeLoaded) {
      console.warn("Iframe not ready yet")
      return
    }

    const newMode = !isSelectionMode
    setIsSelectionMode(newMode)

    // Instead of trying to inject a script, we'll use a bookmarklet-style approach
    // This injects the selection code directly via the iframe's URL
    if (newMode) {
      try {
        // Create the selection mode script as a bookmarklet-style code
        const selectionScript = `
        (function() {
          // Only initialize once
          if (window.selectionModeInitialized) {
            window.selectionModeActive = true;
            return;
          }
          
          window.selectionModeInitialized = true;
          window.selectionModeActive = true;
          
          let hoveredElement = null;
          let selectedElements = [];
          
          // Create overlay for hover effect
          const hoverOverlay = document.createElement('div');
          hoverOverlay.style.position = 'fixed';
          hoverOverlay.style.pointerEvents = 'none';
          hoverOverlay.style.backgroundColor = 'rgba(168, 85, 247, 0.2)';
          hoverOverlay.style.border = '2px solid rgba(168, 85, 247, 0.8)';
          hoverOverlay.style.zIndex = '9999';
          hoverOverlay.style.display = 'none';
          document.body.appendChild(hoverOverlay);
          
          // Function to update hover overlay position
          function updateHoverOverlay(element) {
            if (!element || !window.selectionModeActive) {
              hoverOverlay.style.display = 'none';
              return;
            }
            
            const rect = element.getBoundingClientRect();
            hoverOverlay.style.display = 'block';
            hoverOverlay.style.top = rect.top + 'px';
            hoverOverlay.style.left = rect.left + 'px';
            hoverOverlay.style.width = rect.width + 'px';
            hoverOverlay.style.height = rect.height + 'px';
          }
          
          // Function to generate a unique selector for an element
          function generateSelector(element) {
            if (element.id) {
              return '#' + element.id;
            }
            
            if (element.className && typeof element.className === 'string') {
              const classes = element.className.split(' ').filter(c => c);
              if (classes.length > 0) {
                return element.tagName.toLowerCase() + '.' + classes.join('.');
              }
            }
            
            let selector = element.tagName.toLowerCase();
            let parent = element.parentElement;
            let siblings = parent ? Array.from(parent.children) : [];
            
            if (siblings.length > 1) {
              const index = siblings.indexOf(element);
              selector += ':nth-child(' + (index + 1) + ')';
            }
            
            return selector;
          }
          
          // Function to create a selection overlay for a selected element
          function createSelectionOverlay(element) {
            const rect = element.getBoundingClientRect();
            const overlay = document.createElement('div');
            overlay.className = 'selection-overlay';
            overlay.style.position = 'fixed';
            overlay.style.pointerEvents = 'none';
            overlay.style.backgroundColor = 'rgba(168, 85, 247, 0.3)';
            overlay.style.border = '2px solid rgba(168, 85, 247, 1)';
            overlay.style.zIndex = '9998';
            overlay.style.top = rect.top + 'px';
            overlay.style.left = rect.left + 'px';
            overlay.style.width = rect.width + 'px';
            overlay.style.height = rect.height + 'px';
            document.body.appendChild(overlay);
            return overlay;
          }
          
          // Mouse move handler
          function handleMouseMove(e) {
            if (!window.selectionModeActive) return;
            
            // Ignore events on overlays
            if (e.target.className === 'selection-overlay') return;
            
            hoveredElement = e.target;
            updateHoverOverlay(hoveredElement);
          }
          
          // Click handler
          function handleClick(e) {
            if (!window.selectionModeActive) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // Ignore clicks on overlays
            if (e.target.className === 'selection-overlay') return;
            
            // Check if element is already selected
            const selector = generateSelector(e.target);
            const isAlreadySelected = selectedElements.some(el => el.selector === selector);
            
            if (!isAlreadySelected) {
              const overlay = createSelectionOverlay(e.target);
              selectedElements.push({
                element: e.target,
                selector: selector,
                html: e.target.outerHTML,
                overlay: overlay
              });
              
              // Send message to parent window
              window.parent.postMessage({
                type: 'elementSelected',
                elements: selectedElements.map(el => ({
                  selector: el.selector,
                  html: el.html
                }))
              }, '*');
            }
            
            return false;
          }
          
          // Add event listeners
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('click', handleClick, true);
          
          // Function to disable selection mode
          window.disableSelectionMode = function() {
            window.selectionModeActive = false;
            hoverOverlay.style.display = 'none';
            
            // Send final selection to parent
            window.parent.postMessage({
              type: 'selectionModeDisabled',
              elements: selectedElements.map(el => ({
                selector: el.selector,
                html: el.html
              }))
            }, '*');
          };
          
          // Function to clear selections
          window.clearSelections = function() {
            document.querySelectorAll('.selection-overlay').forEach(el => el.remove());
            selectedElements = [];
            
            window.parent.postMessage({
              type: 'selectionModeDisabled',
              elements: []
            }, '*');
          };
          
          // Listen for messages from parent
          window.addEventListener('message', function(event) {
            if (event.source === window.parent) {
              if (event.data.action === 'disableSelectionMode') {
                window.disableSelectionMode();
              } else if (event.data.action === 'clearSelections') {
                window.clearSelections();
              }
            }
          });
          
          console.log('Selection mode enabled');
        })();
      `

        // Create a JavaScript URL
        const jsUrl = `javascript:(${encodeURIComponent(selectionScript)})()`

        // Store the current URL to restore it later
        const currentUrl = iframeRef.current.src

        // Navigate the iframe to the JavaScript URL
        iframeRef.current.src = jsUrl

        // Restore the original URL after a short delay
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.src = currentUrl

            // After the iframe reloads, we need to wait for it to load
            const handleReload = () => {
              // Send a message to enable selection mode
              setTimeout(() => {
                iframeRef.current?.contentWindow?.postMessage(
                  {
                    action: "enableSelectionMode",
                  },
                  "*",
                )
              }, 500)

              // Remove the event listener
              iframeRef.current?.removeEventListener("load", handleReload)
            }

            // Add event listener for iframe load
            iframeRef.current.addEventListener("load", handleReload)
          }
        }, 100)
      } catch (error) {
        console.error("Error enabling selection mode:", error)
        setIsSelectionMode(false)
      }
    } else {
      // Disable selection mode
      try {
        iframeRef.current.contentWindow?.postMessage(
          {
            action: "disableSelectionMode",
          },
          "*",
        )
      } catch (error) {
        console.error("Error disabling selection mode:", error)
      }
    }
  }

  // Clear selected elements
  const clearSelectedElements = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ action: "clearSelections" }, "*")
      } catch (error) {
        console.error("Error sending message to iframe:", error)
      }
    }

    setSelectedElements([])
    if (onElementsSelected) {
      onElementsSelected([])
    }
  }

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our iframe
      if (iframeRef.current && event.source === iframeRef.current.contentWindow) {
        if (event.data.type === "elementSelected" || event.data.type === "selectionModeDisabled") {
          setSelectedElements(event.data.elements || [])
          if (onElementsSelected) {
            onElementsSelected(event.data.elements || [])
          }
        }
      }
    }

    window.addEventListener("message", handleMessage)
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [onElementsSelected])

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIframeLoaded(true)

    // We'll use a simpler approach - just notify that we're ready to receive messages
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Let the iframe know we're ready to communicate
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ action: "parentReady" }, "*")
      }, 500)
    }
  }

  // Add a flex-grow and min-width to ensure the preview maintains its size
  return (
    <div className="flex-1 flex-grow bg-background flex flex-col h-full min-w-0">
      <div className="flex items-center p-2 border-b border-border bg-[#13111C]">
        <div className="flex-1 mx-auto max-w-md flex items-center">
          <div className="bg-background border border-input rounded-md px-3 py-1 text-sm text-center truncate flex-1">
            {isServerStarted ? `https://wegenweb.com/project/${directory}` : "preview.manufactura.ai"}
          </div>
          <button
            onClick={toggleSelectionMode}
            className={`ml-2 p-1.5 rounded-md ${
              isSelectionMode
                ? "bg-purple-600 text-white"
                : "bg-background border border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            title={isSelectionMode ? "Disable selection mode" : "Enable selection mode"}
            disabled={!isServerStarted || isGenerating || !iframeLoaded}
          >
            <Pointer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {selectedElements.length > 0 && (
        <div className="bg-[#13111C] border-b border-border px-4 py-1.5 flex items-center">
          <span className="text-sm text-purple-300 font-medium">
            {selectedElements.length} element{selectedElements.length !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={clearSelectedElements}
            className="ml-2 text-xs text-purple-400 hover:text-purple-300 flex items-center"
          >
            <X className="h-3 w-3 mr-1" />
            Remove
          </button>
        </div>
      )}

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
            ref={iframeRef}
            src={`https://wegenweb.com/project/${directory}`}
            title="Website Preview"
            className="w-full h-full border-none"
            sandbox="allow-same-origin allow-scripts"
            onLoad={handleIframeLoad}
          />
        ) : (
          <iframe
            ref={iframeRef}
            title="Website Preview"
            className="w-full h-full border-none"
            sandbox="allow-same-origin allow-scripts"
            onLoad={handleIframeLoad}
          />
        )}
      </div>
    </div>
  )
}

