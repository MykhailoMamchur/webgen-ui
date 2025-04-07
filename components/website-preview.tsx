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

interface DeploymentAlias {
  project_name: string
  alias: string
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
  const [deploymentAlias, setDeploymentAlias] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false)
  // Add state for selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([])
  const [iframeLoaded, setIframeLoaded] = useState(false)

  // Replace startServer with getDeploymentAlias
  const getDeploymentAlias = async () => {
    if (!directory || isGenerating) return

    try {
      setIsLoading(true)
      setError(null)

      // Call the new deployment/alias API
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to get deployment alias: ${response.status}`)
      }

      const data = (await response.json()) as DeploymentAlias

      if (data.alias) {
        setDeploymentAlias(data.alias)
      } else {
        throw new Error("No alias returned from deployment service")
      }
    } catch (error) {
      console.error("Error getting deployment alias:", error)
      setError((error as Error).message || "Failed to get deployment alias")
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

    // Get deployment alias if needed, but ONLY if not generating
    if (directory && !isGenerating && !deploymentAlias && !isLoading) {
      getDeploymentAlias()
    }
  }, [])

  // Reset state when directory changes, but don't check status during generation
  useEffect(() => {
    // Reset state when directory changes
    setDeploymentAlias(null)
    setError(null)
    setIframeLoaded(false)
    setSelectedElements([])

    // Clear any selection overlays in the current iframe before changing
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ action: "clearSelections" }, "*")
        // If selection mode was active, disable it
        if (isSelectionMode) {
          iframeRef.current.contentWindow.postMessage({ action: "disableSelectionMode" }, "*")
          setIsSelectionMode(false)
        }
      } catch (error) {
        // Ignore errors during cleanup
        console.log("Cleanup error (safe to ignore):", error)
      }
    }

    // Get deployment alias for this directory, but ONLY if not generating
    if (directory && !isGenerating) {
      getDeploymentAlias()
    }

    // Cleanup function
    return () => {
      // Clean up any iframe-related resources when unmounting or changing directory
      if (iframeRef.current) {
        // Remove src to stop any ongoing requests
        iframeRef.current.src = "about:blank"
      }
    }
  }, [directory, isGenerating])

  // Handle iframe content for placeholder
  useEffect(() => {
    if (iframeRef.current && !deploymentAlias && !hasGeneratedContent) {
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
              <p>The deployment will be prepared automatically when content is ready.</p>
            </div>
          </body>
          </html>
        `)
        iframeDoc.close()
      }
    }
  }, [deploymentAlias, hasGeneratedContent])

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
    // Only set as loaded if the iframe still exists and has a valid contentWindow
    if (iframeRef.current && iframeRef.current.contentWindow) {
      setIframeLoaded(true)

      // We'll use a simpler approach - just notify that we're ready to receive messages
      try {
        // Let the iframe know we're ready to communicate
        setTimeout(() => {
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ action: "parentReady" }, "*")
          }
        }, 500)
      } catch (error) {
        console.error("Error communicating with iframe:", error)
      }
    }
  }

  // Add error handling for iframe navigation
  const handleIframeError = () => {
    setIframeLoaded(false)
    setError("Failed to load preview. Please try refreshing.")
  }

  // Add a flex-grow and min-width to ensure the preview maintains its size
  return (
    <div className="flex-1 flex-grow bg-background flex flex-col h-full min-w-0">
      <div className="flex items-center p-2 border-b border-border bg-[#13111C]">
        <div className="flex-1 mx-auto max-w-md flex items-center">
          <div className="bg-background border border-input rounded-md px-3 py-1 text-sm text-center truncate flex-1">
            {deploymentAlias ? deploymentAlias : "preview.manufactura.ai"}
          </div>
          <button
            onClick={toggleSelectionMode}
            className={`ml-2 p-1.5 rounded-md ${
              isSelectionMode
                ? "bg-purple-600 text-white"
                : "bg-background border border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            title={isSelectionMode ? "Disable selection mode" : "Enable selection mode"}
            disabled={!deploymentAlias || isGenerating || !iframeLoaded}
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
              <p className="text-purple-200">Preparing deployment...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0A090F]/80 z-10">
            <div className="bg-[#13111C] p-6 rounded-lg border border-red-500/30 max-w-md">
              <h3 className="text-red-400 font-medium mb-2">Error Preparing Deployment</h3>
              <p className="text-gray-300 text-sm">{error}</p>
              <button
                onClick={getDeploymentAlias}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {deploymentAlias ? (
          <iframe
            key={`preview-${directory}`}
            ref={iframeRef}
            src={deploymentAlias}
            title="Website Preview"
            className="w-full h-full border-none"
            sandbox="allow-same-origin allow-scripts"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        ) : (
          <iframe
            key={`placeholder-${directory}`}
            ref={iframeRef}
            title="Website Preview"
            className="w-full h-full border-none"
            sandbox="allow-same-origin allow-scripts"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}
      </div>
    </div>
  )
}

