"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import ChatSidebar from "@/components/chat-sidebar"
import WebsitePreview from "@/components/website-preview"
import NewProjectModal from "@/components/new-project-modal"
import { Tabs } from "@/components/tabs"
import GenerationCodeView from "@/components/generation-code-view"
import ProjectFilesTab from "@/components/project-files-tab"
import type { Project, ProjectSummary } from "@/types/project"
import DeploymentModal from "@/components/deployment-modal"
import PromptsModal from "@/components/prompts-modal"
import UpgradeSuccessHandler from "@/components/upgrade-success-handler"
import { useAuth } from "@/context/auth-context"
import { X } from "lucide-react"

// Update the DEFAULT_HTML to be empty
const DEFAULT_HTML = ``

// Initial welcome message for new projects - shorter and simpler
const WELCOME_MESSAGE =
  "Describe a desired website (purpose, style, content) and I'll create it for you. What would you like to build today?"

// Random project name generator
const generateProjectName = (existingNames: string[] = []) => {
  const adjectives = [
    "autumn",
    "hidden",
    "bitter",
    "misty",
    "silent",
    "empty",
    "dry",
    "dark",
    "summer",
    "icy",
    "delicate",
    "quiet",
    "white",
    "cool",
    "spring",
    "winter",
    "patient",
    "twilight",
    "dawn",
    "crimson",
    "wispy",
    "weathered",
    "blue",
    "billowing",
    "broken",
    "cold",
    "damp",
    "falling",
    "frosty",
    "green",
    "long",
    "late",
    "lingering",
    "bold",
    "little",
    "morning",
    "muddy",
    "old",
    "red",
    "rough",
    "still",
    "small",
    "sparkling",
    "throbbing",
    "shy",
    "wandering",
    "withered",
    "wild",
    "black",
    "young",
    "holy",
    "solitary",
    "fragrant",
    "aged",
    "snowy",
    "proud",
    "floral",
    "restless",
    "divine",
    "polished",
    "ancient",
    "purple",
    "lively",
    "nameless",
  ]

  const nouns = [
    "waterfall",
    "river",
    "breeze",
    "moon",
    "rain",
    "wind",
    "sea",
    "morning",
    "snow",
    "lake",
    "sunset",
    "pine",
    "shadow",
    "leaf",
    "dawn",
    "glitter",
    "forest",
    "hill",
    "cloud",
    "meadow",
    "sun",
    "glade",
    "bird",
    "brook",
    "butterfly",
    "bush",
    "dew",
    "dust",
    "field",
    "fire",
    "flower",
    "firefly",
    "feather",
    "grass",
    "haze",
    "mountain",
    "night",
    "pond",
    "darkness",
    "snowflake",
    "silence",
    "sound",
    "sky",
    "shape",
    "surf",
    "thunder",
    "violet",
    "water",
    "wildflower",
    "wave",
    "water",
    "resonance",
    "sun",
    "wood",
    "dream",
    "cherry",
    "tree",
    "fog",
    "frost",
    "voice",
    "paper",
    "frog",
    "smoke",
    "star",
  ]

  let name = ""
  let attempts = 0
  const maxAttempts = 100

  while (attempts < maxAttempts) {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    name = `project-${adjective}-${noun}`

    if (!existingNames.includes(name)) {
      return name
    }

    attempts++
  }

  // If we couldn't find a unique name after max attempts, add a random number
  return `project-${Math.floor(Math.random() * 10000)}`
}

// Add the SelectedElement interface
interface SelectedElement {
  selector: string
  html: string
}

// Update the ImageData interface to match the one in chat-sidebar.tsx
interface ImageData {
  file: File
  previewUrl: string
  rawBase64?: string
  originalFormat?: string
  wasConverted?: boolean
  originalWidth?: number | null
  originalHeight?: number | null
}

// Add TierData interface
interface TierData {
  user_id: string
  tier_type: string
  edits_left: number
  renewal_at: number
}

// Add UserData interface
interface UserData {
  id: string
  email: string
  name?: string
}

// Update the Home component to handle selected elements
function HomeContent() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  // Add state for selected elements
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([])

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("generation")
  const [isExiting, setIsExiting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  // Add a state for tracking which checkpoint is being restored
  const [restoringCheckpoint, setRestoringCheckpoint] = useState<string | null>(null)
  // Add state for deployment modal
  const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false)
  // Add state for prompts modal
  const [isPromptsModalOpen, setIsPromptsModalOpen] = useState(false)

  // Add state for tier data and low edits warning
  const [tierData, setTierData] = useState<TierData | null>(null)
  const [showLowEditsWarning, setShowLowEditsWarning] = useState(false)

  // Add state for upgrade success banner
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false)

  const [userData, setUserData] = useState<UserData | null>(null)

  // Projects state
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)

  // Current project data
  const currentProject = currentProjectId ? projects.find((p) => p.id === currentProjectId) || null : null

  const messages = currentProject?.messages || []
  const websiteContent = currentProject?.websiteContent || DEFAULT_HTML
  const codeContent = currentProject?.codeContent || DEFAULT_HTML
  const projectName = currentProject?.name || ""

  // Redirect to signup if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signup")
    }
  }, [isAuthenticated, isLoading, router])

  // Function to fetch user tier data
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
          // Check if user is running low on edits
          if (data.tier_data.edits_left <= 5) {
            setShowLowEditsWarning(true)
          } else {
            setShowLowEditsWarning(false)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user tier data:", error)
    }
  }

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setUserData(data)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    if (isAuthenticated && !isLoading) {
      fetchUserData()
    }
  }, [isAuthenticated, isLoading])

  // Function to format renewal date
  const formatRenewalDate = (renewalTimestamp: number): string => {
    const renewalDate = new Date(renewalTimestamp)
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      hour: "numeric",
      hour12: true,
    }
    return renewalDate.toLocaleDateString("en-US", options)
  }

  // Function to get the appropriate warning message based on edits left
  const getWarningMessage = (editsLeft: number, renewalDate: string): string => {
    if (editsLeft === 0) {
      return `You are out of edits. Your limit will reset on ${renewalDate}.`
    } else {
      return `You are running low on edits. Your limit will reset on ${renewalDate}.`
    }
  }

  // Update the function to use project_id instead of project_name/directory
  // Function to save a message to the server
  const saveMessageToServer = async (projectId: string, message: { role: "user" | "assistant"; content: string }) => {
    try {
      const response = await fetch("/api/chat/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
          message: {
            role: message.role,
            content: message.content,
          },
        }),
        credentials: "include", // Include cookies in the request
      })

      if (!response.ok) {
        console.error("Failed to save message to server:", await response.text())
      }
    } catch (error) {
      console.error("Error saving message to server:", error)
    }
  }

  // Function to load messages from the server
  const loadMessagesFromServer = async (projectId: string) => {
    try {
      const response = await fetch("/api/chat/load", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
        }),
        credentials: "include", // Include cookies in the request
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()

      // Check if data.messages exists and is an array
      if (data.messages && Array.isArray(data.messages)) {
        return data.messages
      }

      return []
    } catch (error) {
      return []
    }
  }

  // Function to load logs from the server
  const loadLogsFromServer = async (projectId: string) => {
    try {
      const response = await fetch("/api/logs/load", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
        }),
        credentials: "include", // Include cookies in the request
      })

      if (!response.ok) {
        return ""
      }

      const data = await response.json()

      // Check if data.logs exists
      if (data.logs) {
        return data.logs
      }

      return ""
    } catch (error) {
      return ""
    }
  }

  // Handle tab changes to trigger status checks only when needed
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
  }

  // Update the useEffect to handle the new projects response format
  // Update the useEffect to load projects from the API
  useEffect(() => {
    // Only fetch projects if authenticated
    if (!isAuthenticated || isLoading) return

    // First try to load projects from the API
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects", {
          credentials: "include", // Include cookies in the request
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.status}`)
        }

        const data = await response.json()

        if (data.projects && Array.isArray(data.projects)) {
          // Convert project data to Project objects using the new format
          const projectsFromAPI = data.projects.map((project: any) => ({
            id: project.id, // Use the server-provided ID
            name: project.name,
            description: `Project ${project.name}`,
            createdAt: new Date(project.created_at),
            updatedAt: new Date(project.created_at), // Use created_at as updatedAt for now
            projectName: project.name, // Use name as projectName
            websiteContent: DEFAULT_HTML,
            codeContent: DEFAULT_HTML,
            messages: [],
            // Add any other properties from the API response
            created_timestamp: project.created_timestamp,
          }))

          setProjects(projectsFromAPI)

          // Don't set any project as current at startup
          // Let the user select or create a new one
          return
        }
      } catch (error) {
        console.error("Error fetching projects:", error)
        // Fall back to localStorage
        loadProjectsFromLocalStorage()
      }
    }

    const loadProjectsFromLocalStorage = () => {
      const savedProjects = localStorage.getItem("manufactura_projects")
      if (savedProjects) {
        try {
          const parsedProjects = JSON.parse(savedProjects)
          // Convert string dates back to Date objects
          const projectsWithDates = parsedProjects.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
            // Convert directory to projectName if it exists
            projectName: p.projectName || p.directory || p.name,
          }))
          setProjects(projectsWithDates)

          // Don't set any project as current at startup
          // Let the user select or create a new one
        } catch (error) {
          console.error("Error loading projects from localStorage:", error)
        }
      }
    }

    // Fetch projects and tier data
    fetchProjects()
    fetchUserTierData()
  }, [isAuthenticated, isLoading])

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem("manufactura_projects", JSON.stringify(projects))
    }
  }, [projects])

  // Add this function to handle aborting generation
  const abortGeneration = () => {
    if (abortController) {
      abortController.abort()
      setIsGenerating(false)
      setAbortController(null)

      // Add a system message indicating the generation was stopped
      if (currentProjectId && currentProject) {
        const abortMessage = {
          role: "assistant" as const,
          content: "Generation stopped by user.",
        }

        updateCurrentProject({
          messages: [...messages, abortMessage],
        })

        // Save the abort message to the server
        saveMessageToServer(currentProject.id, abortMessage)
      }
    }
  }

  // Create a new project with a random name
  const createProject = async (name: string, description: string) => {
    // Abort any ongoing generation
    if (abortController) {
      abortController.abort()
      setIsGenerating(false)
      setAbortController(null)
    }

    // Ensure the name doesn't have spaces
    const formattedName = name.trim().replace(/\s+/g, "-")

    try {
      // First, make an authenticated POST request to create the project on the server
      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_name: formattedName,
        }),
        credentials: "include", // Include cookies for authentication
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create project: ${response.status}`)
      }

      // Get the project_id from the response
      const data = await response.json()
      const projectId = data.project_id

      if (!projectId) {
        throw new Error("No project_id returned from server")
      }

      // Create welcome message
      const welcomeMessage = {
        role: "assistant" as const,
        content: WELCOME_MESSAGE,
      }

      // Create the project object with the server-provided ID
      const newProject: Project = {
        id: projectId,
        name: formattedName,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
        projectName: formattedName,
        websiteContent: DEFAULT_HTML,
        codeContent: DEFAULT_HTML,
        messages: [welcomeMessage],
      }

      // Update local state
      setProjects((prev) => [...prev, newProject])
      setCurrentProjectId(projectId)

      // Switch to Generation tab when creating a new project
      setActiveTab("generation")

      // Save the welcome message to the server
      await saveMessageToServer(projectId, welcomeMessage)

      return projectId
    } catch (error) {
      console.error("Error creating project:", error)
      alert(`Failed to create project: ${(error as Error).message}`)
      throw error
    }
  }

  // Update the deleteProject function to use project_id
  // Delete a project
  const deleteProject = async (projectId: string): Promise<void> => {
    const projectToDelete = projects.find((p) => p.id === projectId)
    if (!projectToDelete) return

    try {
      // Call the API to delete the project on the server
      const response = await fetch("/api/project/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectToDelete.id, // Use the project's ID from the server
        }),
        credentials: "include", // Include cookies in the request
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete project: ${response.status}`)
      }

      // Remove the project from local state
      setProjects((prev) => prev.filter((p) => p.id !== projectId))

      // If the deleted project is the current one, select another one
      if (currentProjectId === projectId) {
        const remainingProjects = projects.filter((p) => p.id !== projectId)
        if (remainingProjects.length > 0) {
          setCurrentProjectId(remainingProjects[0].id)
        } else {
          setCurrentProjectId(null)
        }
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      alert(`Failed to delete project: ${(error as Error).message}`)
      throw error // Re-throw to propagate to the UI
    }
  }

  // Update the current project
  const updateCurrentProject = (updates: Partial<Project>) => {
    if (!currentProjectId) return

    setProjects((prev) =>
      prev.map((project) =>
        project.id === currentProjectId
          ? {
              ...project,
              ...updates,
              updatedAt: new Date(),
            }
          : project,
      ),
    )
  }

  // Update the handleRenameProject function to use project_id
  // Add a function to handle project renaming
  const handleRenameProject = async (projectId: string, newName: string) => {
    const projectToRename = projects.find((p) => p.id === projectId)
    if (!projectToRename) return

    try {
      // Format the new name (replace spaces with hyphens)
      const formattedNewName = newName.trim().replace(/\s+/g, "-")

      // Call the API to rename the project on the server
      const response = await fetch("/api/project/rename", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectToRename.id, // Use the project's ID from the server
          new_project_name: formattedNewName,
        }),
        credentials: "include", // Include cookies in the request
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to rename project: ${response.status}`)
      }

      // Only update the local state after the server-side rename is successful
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id === projectId) {
            return {
              ...project,
              name: formattedNewName,
              projectName: formattedNewName, // Update projectName
              updatedAt: new Date(),
            }
          }
          return project
        }),
      )

      // If the renamed project is the current one, we don't need to change the ID
      // Just let the UI update with the new name
    } catch (error) {
      console.error("Error renaming project:", error)
      alert(`Failed to rename project: ${(error as Error).message}`)
      throw error // Re-throw to propagate to the UI
    }
  }

  // Update the handleStart function to work with the new createProject function
  const handleStart = async (prompt: string, image?: File | null) => {
    setIsExiting(true)

    // Create a new project if none exists
    let projectId = currentProjectId
    if (!projectId) {
      try {
        // Create a project with a random name
        const existingNames = projects.map((p) => p.name)
        const projectName = generateProjectName(existingNames)
        projectId = await createProject(projectName, prompt.substring(0, 100))

        if (!projectId) {
          throw new Error("Failed to create project: No project ID returned")
        }
      } catch (error) {
        console.error("Error creating project:", error)
        setIsExiting(false)
        return
      }
    }

    setTimeout(async () => {
      const project = projects.find((p) => p.id === projectId)
      if (!project) return

      // Fetch the latest messages before adding the user message
      try {
        const serverMessages = await loadMessagesFromServer(project.id)
        if (serverMessages && serverMessages.length > 0) {
          updateCurrentProject({ messages: serverMessages })
        }
      } catch (error) {
        console.error("Error fetching messages before starting:", error)
      }

      // Create user message
      const userMessage = {
        role: "user" as const,
        content: prompt,
      }

      // Update messages
      const newMessages = [
        {
          role: "assistant" as const,
          content: WELCOME_MESSAGE,
        },
        userMessage,
      ]

      updateCurrentProject({ messages: newMessages })

      // Save the user message to the server
      await saveMessageToServer(project.id, userMessage)

      // Switch to the Generation tab to show streaming content
      setActiveTab("generation")

      // Start generating content
      await generateContent(prompt, image ? [{ file: image, previewUrl: URL.createObjectURL(image) }] : undefined)

      // Fetch the latest messages after generation
      try {
        const serverMessages = await loadMessagesFromServer(project.id)
        if (serverMessages && serverMessages.length > 0) {
          updateCurrentProject({ messages: serverMessages })
          return // Skip adding the default assistant response if we got messages from server
        }
      } catch (error) {
        console.error("Error fetching messages after generation:", error)
      }

      // Add assistant response after generation is complete if no error occurred and we didn't get messages from server
      if (!generationError && project) {
        const assistantResponse = {
          role: "assistant" as const,
          content:
            "I've generated a website based on your vision. You can see the preview and the code. Let me know if you'd like to make any changes!",
        }

        updateCurrentProject({
          messages: [...newMessages, assistantResponse],
        })

        // Save the assistant response to the server
        await saveMessageToServer(project.id, assistantResponse)

        // Fetch messages one more time after saving the assistant response
        try {
          const serverMessages = await loadMessagesFromServer(project.id)
          if (serverMessages && serverMessages.length > 0) {
            updateCurrentProject({ messages: serverMessages })
          }
        } catch (error) {
          console.error("Error fetching messages after assistant response:", error)
        }
      }
    }, 300)
  }

  // Function to convert image to base64
  const imageToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Update the generateContent function to use project_id
  // Replace the generateContent function with this version that uses /edit for both initial generation and edits
  const generateContent = async (description: string, images?: ImageData[]) => {
    if (!currentProjectId || !projectName || !currentProject) return

    try {
      // Reset error state
      setGenerationError(null)

      // Abort any existing generation
      if (abortController) {
        abortController.abort()
      }

      // Create a new AbortController
      const controller = new AbortController()
      setAbortController(controller)
      setIsGenerating(true)

      // Store the current code content to append to it
      const existingCode = currentProject.codeContent

      // Switch to generation tab
      setActiveTab("generation")

      // Use the edit API for both initial generation and edits
      // Include selected elements in the request if available
      const requestBody: any = {
        description,
        project_id: currentProject.id, // Use the project's ID from the server
      }

      // Add selected elements to the request if available
      if (selectedElements.length > 0) {
        requestBody.selected_elements = selectedElements
      }

      // Add images to the request if available
      if (images && images.length > 0) {
        try {
          const imageData = await Promise.all(
            images.map(async (img) => {
              // Get the processed image as base64
              const processedBase64 = await imageToBase64(img.file)

              return {
                image: processedBase64,
                image_name: img.file.name,
                // Always include the raw image data
                image_raw: img.rawBase64,
                // Include the original format
                image_format: img.originalFormat || null,
                // Include the original dimensions
                width_raw: img.originalWidth || null,
                height_raw: img.originalHeight || null,
              }
            }),
          )
          requestBody.images = imageData
        } catch (error) {
          console.error("Error converting images to base64:", error)
        }
      }

      // Get the active prompt if available
      try {
        const promptResponse = await fetch("/api/prompts/get_active", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (promptResponse.ok) {
          const promptData = await promptResponse.json()
          if (promptData.status === "success" && promptData.prompt) {
            // Add the active prompt to the request
            requestBody.prompt = promptData.prompt.prompt_text
          }
        }
      } catch (error) {
        console.error("Error fetching active prompt:", error)
      }

      // Pass the abort signal to ensure server-side processing stops when aborted
      const response = await fetch("/api/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        credentials: "include", // Include cookies in the request
      })

      // Handle 402 Payment Required status BEFORE trying to read the response body
      if (response.status === 402) {
        let upgradeMessage = "You have no edits left. Upgrade plan to continue."

        // Try to get the detailed error message from the response
        try {
          const errorData = await response.json()
          if (errorData.detail) {
            upgradeMessage = errorData.detail
          }
        } catch (parseError) {
          // Use default message if we can't parse the response
          console.error("Error parsing 402 response:", parseError)
        }

        setGenerationError(upgradeMessage)

        // Add an upgrade message to the chat
        if (currentProjectId && currentProject) {
          const upgradeResponse = {
            role: "assistant" as const,
            content: upgradeMessage,
          }

          updateCurrentProject({
            messages: [...messages, upgradeResponse],
          })

          // Save the upgrade message to the server
          await saveMessageToServer(currentProject.id, upgradeResponse)
        }

        setIsGenerating(false)
        setAbortController(null)
        return
      }

      // Handle other non-OK responses
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Server responded with status ${response.status}`)
      }

      if (!response.body) {
        throw new Error("Response body is null")
      }

      // Set up the reader for the stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let generatedCode = ""

      // Read the stream continuously
      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          // Decode the chunk and append to the code
          const chunk = decoder.decode(value, { stream: true })

          // Filter out keep-alive comments
          const filteredChunk = chunk.replace(/\n?<!-- keep-alive -->\n?/g, "")

          if (filteredChunk) {
            generatedCode += filteredChunk

            // Update the project with the new content - APPEND instead of overwrite
            updateCurrentProject({
              codeContent: existingCode + generatedCode,
              websiteContent: generatedCode, // Website content is still just the new content
            })
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          // Generation aborted
          console.log("Generation aborted by user")
        } else {
          throw error
        }
      } finally {
        // Make sure to close the reader
        reader.releaseLock()
      }

      setIsGenerating(false)
      setAbortController(null)

      // Fetch tier data after each edit to update edits_left
      await fetchUserTierData()

      // Switch to preview tab when generation is complete
      setActiveTab("preview")

      // Fetch the latest messages including git messages
      try {
        const serverMessages = await loadMessagesFromServer(currentProject.id)
        if (serverMessages && serverMessages.length > 0) {
          updateCurrentProject({
            messages: serverMessages,
          })
        }
      } catch (error) {
        console.error("Error fetching messages after generation:", error)
      }
    } catch (error) {
      // Check if this was an abort error
      if ((error as Error).name === "AbortError") {
        console.log("Generation aborted by user")
      } else {
        const errorMessage = (error as Error).message || "Failed to generate content"
        setGenerationError(errorMessage)

        // Update the project with the error message
        updateCurrentProject({
          codeContent: currentProject.codeContent + `\n\nError: ${errorMessage}. Please try again.`,
        })

        // Add an error message to the chat
        if (currentProjectId && currentProject) {
          const errorResponse = {
            role: "assistant" as const,
            content: `Sorry, I encountered an error while generating content: ${errorMessage}. Please try again.`,
          }

          updateCurrentProject({
            messages: [...messages, errorResponse],
          })

          // Save the error message to the server
          await saveMessageToServer(currentProject.id, errorResponse)

          // Fetch messages after saving the error response
          try {
            const serverMessages = await loadMessagesFromServer(currentProject.id)
            if (serverMessages && serverMessages.length > 0) {
              updateCurrentProject({
                messages: serverMessages,
              })
            }
          } catch (error) {
            console.error("Error fetching messages after error response:", error)
          }
        }
      }
      setIsGenerating(false)
      setAbortController(null)
    }
  }

  // Add a handler for selected elements
  const handleElementsSelected = (elements: SelectedElement[]) => {
    setSelectedElements(elements)
  }

  // Update handleSendMessage to include multiple images
  const handleSendMessage = async (message: string, images?: ImageData[]) => {
    if (!currentProjectId || !currentProject) return

    // Fetch the latest messages before sending a new message
    try {
      const serverMessages = await loadMessagesFromServer(currentProject.id)
      if (serverMessages && serverMessages.length > 0) {
        updateCurrentProject({ messages: serverMessages })
      }
    } catch (error) {
      console.error("Error fetching messages before sending:", error)
    }

    // Create user message with image information
    const userMessage = {
      role: "user" as const,
      content:
        images && images.length > 0
          ? `${message} [${images.length} image${images.length !== 1 ? "s" : ""} attached: ${images.map((img) => img.file.name).join(", ")}]`
          : message,
    }

    // Add user message
    const updatedMessages = [...messages, userMessage]
    updateCurrentProject({ messages: updatedMessages })

    // Save the user message to the server
    await saveMessageToServer(currentProject.id, userMessage)

    // Generate new content based on the message and images
    await generateContent(message, images)

    // Clear selected elements after sending
    setSelectedElements([])

    // Fetch the latest messages after sending and generation
    try {
      const serverMessages = await loadMessagesFromServer(currentProject.id)
      if (serverMessages && serverMessages.length > 0) {
        updateCurrentProject({ messages: serverMessages })
        return // Skip adding the default assistant response if we got messages from server
      }
    } catch (error) {
      console.error("Error fetching messages after sending:", error)
    }

    // Add assistant response if no error occurred and we didn't get messages from server
    if (!generationError && currentProject) {
      const assistantResponse = {
        role: "assistant" as const,
        content:
          "I've updated the website based on your feedback. Take a look at the preview and let me know what you think!",
      }

      updateCurrentProject({
        messages: [...updatedMessages, assistantResponse],
      })

      // Save the assistant response to the server
      await saveMessageToServer(currentProject.id, assistantResponse)

      // Fetch messages one more time after saving the assistant response
      try {
        const serverMessages = await loadMessagesFromServer(currentProject.id)
        if (serverMessages && serverMessages.length > 0) {
          updateCurrentProject({ messages: serverMessages })
        }
      } catch (error) {
        console.error("Error fetching messages after assistant response:", error)
      }
    }
  }

  // Handle deployment
  const handleDeploy = () => {
    if (!currentProject) return
    setIsDeploymentModalOpen(true)
  }

  // Handle opening prompts modal
  const handleOpenPrompts = () => {
    setIsPromptsModalOpen(true)
  }

  const handleUpgrade = () => {
    // Get the current path to use as return URL
    const returnUrl = window.location.pathname
    router.push(`/subscribe?returnUrl=${encodeURIComponent(returnUrl)}`)
  }

  const tabs = [
    { id: "preview", label: "Preview" },
    { id: "generation", label: "Generation" },
    { id: "project-files", label: "Project Files" },
  ]

  // For the project selector dropdown
  const projectSummaries: ProjectSummary[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    projectName: p.projectName, // Use projectName instead of directory
  }))

  const currentProjectSummary = currentProjectId
    ? projectSummaries.find((p) => p.id === currentProjectId) || null
    : null

  // Add this function to handle project selection with abort
  const handleSelectProject = async (projectId: string) => {
    // Don't allow project selection during generation
    if (isGenerating) return

    // Abort any ongoing generation
    if (abortController) {
      abortController.abort()
      setIsGenerating(false)
      setAbortController(null)
    }

    // If we're in preview tab, switch to generation tab first to avoid iframe issues
    if (activeTab === "preview") {
      setActiveTab("generation")
    }

    const selectedProject = projects.find((p) => p.id === projectId)
    if (!selectedProject) return

    // First set the current project ID so the UI updates immediately
    setCurrentProjectId(projectId)

    // Load both messages and logs from the server
    try {
      // Load messages
      const serverMessages = await loadMessagesFromServer(selectedProject.id)

      // Load logs
      const serverLogs = await loadLogsFromServer(selectedProject.id)

      // Fetch tier data when switching projects
      await fetchUserTierData()

      // Update project with messages and logs
      setProjects((prevProjects) =>
        prevProjects.map((project) => {
          if (project.id === projectId) {
            return {
              ...project,
              messages: serverMessages && serverMessages.length > 0 ? serverMessages : project.messages,
              codeContent: serverLogs || project.codeContent,
            }
          }
          return project
        }),
      )

      // If no messages, add welcome message
      if (
        (!serverMessages || serverMessages.length === 0) &&
        (!selectedProject.messages || selectedProject.messages.length === 0)
      ) {
        // If no messages on server or in local state, add welcome message
        const welcomeMessage = {
          role: "assistant" as const,
          content: WELCOME_MESSAGE,
        }

        setProjects((prevProjects) =>
          prevProjects.map((project) =>
            project.id === projectId ? { ...project, messages: [welcomeMessage] } : project,
          ),
        )

        // Save the welcome message to the server
        await saveMessageToServer(selectedProject.id, welcomeMessage)
      }
    } catch (error) {
      // Fallback to local messages or add welcome message if none exist
      if (!selectedProject.messages || selectedProject.messages.length === 0) {
        const welcomeMessage = {
          role: "assistant" as const,
          content: WELCOME_MESSAGE,
        }

        setProjects((prevProjects) =>
          prevProjects.map((project) =>
            project.id === projectId ? { ...project, messages: [welcomeMessage] } : project,
          ),
        )

        // Try to save the welcome message to the server
        try {
          await saveMessageToServer(selectedProject.id, welcomeMessage)
        } catch (saveError) {
          // Handle error silently
        }
      }
    }
  }

  // Update the handleRestoreCheckpoint function to use project_id
  // Add the handleRestoreCheckpoint function
  const handleRestoreCheckpoint = async (hash: string) => {
    if (!currentProject) return

    try {
      // Set loading state
      setRestoringCheckpoint(hash)

      const response = await fetch("/api/git/revert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: currentProject.id, // Use the project's ID from the server
          commit_hash: hash,
        }),
        credentials: "include", // Include cookies in the request
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to restore checkpoint: ${response.status}`)
      }

      // Refresh the project content
      const serverLogs = await loadLogsFromServer(currentProject.id)
      if (serverLogs) {
        updateCurrentProject({
          codeContent: serverLogs,
        })
      }

      // Fetch the latest messages including the new git revert message
      const serverMessages = await loadMessagesFromServer(currentProject.id)
      if (serverMessages && serverMessages.length > 0) {
        updateCurrentProject({
          messages: serverMessages,
        })
      } else {
        // If server messages couldn't be fetched, add a local git message
        const revertMessage = {
          role: "git" as const,
          content: "Previous version has been restored successfully.",
          action: "revert",
        }

        updateCurrentProject({
          messages: [...messages, revertMessage],
        })
      }

      // Switch to generation tab to show the restored code
      setActiveTab("generation")
    } catch (error) {
      console.error("Error restoring checkpoint:", error)
      alert(`Failed to restore checkpoint: ${(error as Error).message}`)
    } finally {
      // Clear loading state
      setRestoringCheckpoint(null)
    }
  }

  // If still loading or not authenticated, show a loading state
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A090F]">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Fix the width issues by adding a min-width to the main content area
  return (
    <div className="flex flex-col h-screen bg-[#0A090F]">
      {/* Upgrade Success Banner */}
      <Suspense fallback={null}>
        <UpgradeSuccessHandler onUpgradeSuccess={setShowUpgradeSuccess} />
      </Suspense>

      <Header
        currentProject={currentProjectSummary}
        projects={projectSummaries}
        onSelectProject={handleSelectProject}
        onNewProject={() => setIsNewProjectModalOpen(true)}
        onDeleteProject={deleteProject}
        onRenameProject={handleRenameProject}
        isGenerating={isGenerating}
        onDeploy={handleDeploy}
        onOpenPrompts={handleOpenPrompts}
      />

      {/* Low edits warning banner */}
      {showLowEditsWarning && tierData && !showUpgradeSuccess && (
        <div className="bg-purple-900/20 border-b border-purple-900/30 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-purple-100">
                {getWarningMessage(tierData.edits_left, formatRenewalDate(tierData.renewal_at))}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpgrade}
                className="text-sm text-emerald-400 hover:text-emerald-300 font-semibold transition-colors hover:bg-emerald-500/20 px-3 py-1.5 rounded-md hover:border-emerald-500/30"
              >
                Upgrade Plan
              </button>
              <button
                onClick={() => setShowLowEditsWarning(false)}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar
          messages={messages}
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          onAbortGeneration={abortGeneration}
          noProjectSelected={!currentProjectId}
          onCreateProject={() => setIsNewProjectModalOpen(true)}
          selectedElementsCount={selectedElements.length}
          onClearSelectedElements={() => setSelectedElements([])}
          onRestoreCheckpoint={handleRestoreCheckpoint}
          restoringCheckpoint={restoringCheckpoint}
        />
        <div className="flex-1 flex flex-col w-full min-w-0">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={handleTabChange}
            className="bg-[#13111C]"
            isGenerating={isGenerating}
          />
          <div className="flex-1 overflow-hidden">
            {activeTab === "preview" ? (
              <WebsitePreview
                content={websiteContent}
                projectName={currentProject?.name || ""}
                projectId={currentProject?.id || ""} // Pass projectId to WebsitePreview
                isGenerating={isGenerating}
                onTabActivated={() => {
                  // Only check status when preview tab is activated and NOT generating
                  if (currentProject?.name && !isGenerating) {
                    // Status check will happen inside the component
                  }
                }}
                onElementsSelected={handleElementsSelected}
              />
            ) : activeTab === "project-files" ? (
              <ProjectFilesTab projectId={currentProject?.id || ""} projectName={currentProject?.name || ""} />
            ) : (
              <GenerationCodeView code={codeContent} isGenerating={isGenerating} />
            )}
          </div>
        </div>
      </div>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={createProject}
      />

      {isDeploymentModalOpen && currentProject && (
        <DeploymentModal
          isOpen={isDeploymentModalOpen}
          onClose={() => setIsDeploymentModalOpen(false)}
          projectName={currentProject.name}
          projectId={currentProject.id} // Pass projectId to DeploymentModal
        />
      )}

      {/* Add the PromptsModal */}
      <PromptsModal isOpen={isPromptsModalOpen} onClose={() => setIsPromptsModalOpen(false)} />
    </div>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#0A090F]">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
