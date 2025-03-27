"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import ChatSidebar from "@/components/chat-sidebar"
import WebsitePreview from "@/components/website-preview"
import WelcomeScreen from "@/components/welcome-screen"
import NewProjectModal from "@/components/new-project-modal"
import { ThemeProvider } from "@/components/theme-provider"
import { Tabs } from "@/components/tabs"
import CodeView from "@/components/code-view"
import ProjectFilesTab from "@/components/project-files-tab"
import DeploymentsTab from "@/components/deployments-tab"
import type { Project, ProjectSummary } from "@/types/project"
import { v4 as uuidv4 } from "uuid"

// Update the DEFAULT_HTML to be empty
const DEFAULT_HTML = ``

// Initial welcome message for new projects - shorter and simpler
const WELCOME_MESSAGE =
  "Describe a desired website (purpose, style, content) and I'll create it for you. Use commands like /strictlayout, /noimprove, or /norefine if needed. What would you like to build today?"

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

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(false) // Show welcome screen by default
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("generation")
  const [isExiting, setIsExiting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Projects state
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)

  // Current project data
  const currentProject = currentProjectId ? projects.find((p) => p.id === currentProjectId) || null : null

  const messages = currentProject?.messages || []
  const websiteContent = currentProject?.websiteContent || DEFAULT_HTML
  const codeContent = currentProject?.codeContent || DEFAULT_HTML
  const projectName = currentProject?.name || ""

  // Function to save a message to the server
  const saveMessageToServer = async (projectName: string, message: { role: "user" | "assistant"; content: string }) => {
    try {
      const response = await fetch("/api/chat/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_name: projectName,
          message: {
            role: message.role,
            content: message.content,
          },
        }),
      })

      if (!response.ok) {
        console.error("Failed to save message to server:", await response.text())
      }
    } catch (error) {
      console.error("Error saving message to server:", error)
    }
  }

  // Function to load messages from the server
  const loadMessagesFromServer = async (projectName: string) => {
    try {
      const response = await fetch("/api/chat/load", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_name: projectName,
        }),
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
  const loadLogsFromServer = async (projectName: string) => {
    try {
      const response = await fetch("/api/logs/load", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_name: projectName,
        }),
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

  // Update the useEffect to load projects from the API
  useEffect(() => {
    // First try to load projects from the API
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects")
        if (response.ok) {
          const data = await response.json()
          if (data.projects && Array.isArray(data.projects)) {
            // Convert project data to Project objects
            const projectsFromAPI = data.projects.map((project: any) => ({
              id: uuidv4(),
              name: project.name,
              description: `Project ${project.name}`,
              createdAt: new Date(),
              updatedAt: new Date(),
              directory: project.name, // Keep original casing
              websiteContent: DEFAULT_HTML,
              codeContent: DEFAULT_HTML,
              messages: [],
              status: project.status,
              port: project.port,
            }))

            setProjects(projectsFromAPI)

            // Don't set any project as current at startup
            // Let the user select or create a new one
            return
          }
        }

        // If API fails, fall back to localStorage
        loadProjectsFromLocalStorage()
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
          }))
          setProjects(projectsWithDates)

          // Don't set any project as current at startup
          // Let the user select or create a new one
        } catch (error) {
          console.error("Error loading projects from localStorage:", error)
        }
      }
    }

    fetchProjects()
  }, [])

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem("manufactura_projects", JSON.stringify(projects))
    }
  }, [projects])

  // Prevent scrolling when welcome screen is shown
  useEffect(() => {
    if (showWelcome) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [showWelcome])

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
        saveMessageToServer(currentProject.directory, abortMessage)
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

    const welcomeMessage = {
      role: "assistant" as const,
      content: WELCOME_MESSAGE,
    }

    const newProject: Project = {
      id: uuidv4(),
      name: formattedName,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      directory: formattedName, // Keep original casing
      websiteContent: DEFAULT_HTML,
      codeContent: DEFAULT_HTML,
      messages: [welcomeMessage],
    }

    setProjects((prev) => [...prev, newProject])
    setCurrentProjectId(newProject.id)

    // Save the welcome message to the server
    await saveMessageToServer(formattedName, welcomeMessage)
  }

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
          project_name: projectToDelete.directory,
        }),
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

  const handleStart = async (prompt: string) => {
    setIsExiting(true)

    // Create a new project if none exists
    if (!currentProjectId) {
      // Create a project with a random name
      const existingNames = projects.map((p) => p.name)
      const projectName = generateProjectName(existingNames)
      await createProject(projectName, prompt.substring(0, 100))
    }

    setTimeout(async () => {
      setShowWelcome(false)

      if (!currentProject) return

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
      await saveMessageToServer(currentProject.directory, userMessage)

      // Switch to the Generation tab to show streaming content
      setActiveTab("generation")

      // Start generating content
      await generateContent(prompt)

      // Add assistant response after generation is complete if no error occurred
      if (!generationError && currentProject) {
        const assistantResponse = {
          role: "assistant" as const,
          content:
            "I've generated a website based on your vision. You can see the preview and the code. Let me know if you'd like to make any changes!",
        }

        updateCurrentProject({
          messages: [...newMessages, assistantResponse],
        })

        // Save the assistant response to the server
        await saveMessageToServer(currentProject.directory, assistantResponse)
      }

      // Don't switch to preview tab automatically
      // setActiveTab("preview")
    }, 300)
  }

  // Replace the generateContent function with this version that uses /edit for both initial generation and edits
  const generateContent = async (description: string) => {
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
      const response = await fetch("/api/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          project_name: projectName, // Use original casing
        }),
        signal: controller.signal,
      })

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
        } else {
          throw error
        }
      } finally {
        // Make sure to close the reader
        reader.releaseLock()
      }

      setIsGenerating(false)
      setAbortController(null)

      // Switch to preview tab when generation is complete
      setActiveTab("preview")
    } catch (error) {
      // Check if this was an abort error
      if ((error as Error).name === "AbortError") {
        // Generation aborted
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
          await saveMessageToServer(currentProject.directory, errorResponse)
        }
      }
      setIsGenerating(false)
      setAbortController(null)
    }
  }

  // Remove the editContent function and update handleSendMessage to use generateContent
  const handleSendMessage = async (message: string) => {
    if (!currentProjectId || !currentProject) return

    // Create user message
    const userMessage = {
      role: "user" as const,
      content: message,
    }

    // Add user message
    const updatedMessages = [...messages, userMessage]
    updateCurrentProject({ messages: updatedMessages })

    // Save the user message to the server
    await saveMessageToServer(currentProject.directory, userMessage)

    // Generate new content based on the message
    await generateContent(message)

    // Add assistant response if no error occurred
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
      await saveMessageToServer(currentProject.directory, assistantResponse)
    }
  }

  const tabs = [
    { id: "preview", label: "Preview" },
    { id: "generation", label: "Generation" },
    { id: "project-files", label: "Project Files" },
    { id: "deployments", label: "Deployments" },
  ]

  // For the project selector dropdown
  const projectSummaries: ProjectSummary[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    directory: p.directory, // Keep original casing
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

    const selectedProject = projects.find((p) => p.id === projectId)
    if (!selectedProject) return

    // First set the current project ID so the UI updates immediately
    setCurrentProjectId(projectId)

    // Load both messages and logs from the server
    try {
      // Load messages
      const serverMessages = await loadMessagesFromServer(selectedProject.directory)

      // Load logs
      const serverLogs = await loadLogsFromServer(selectedProject.directory)

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
        await saveMessageToServer(selectedProject.directory, welcomeMessage)
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
          await saveMessageToServer(selectedProject.directory, welcomeMessage)
        } catch (saveError) {
          // Handle error silently
        }
      }
    }
  }

  // Fix the width issues by adding a min-width to the main content area
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="flex flex-col h-screen bg-[#0A090F]">
        <Header
          currentProject={currentProjectSummary}
          projects={projectSummaries}
          onSelectProject={handleSelectProject}
          onNewProject={() => setIsNewProjectModalOpen(true)}
          onDeleteProject={deleteProject}
          isGenerating={isGenerating}
        />
        <div className="flex flex-1 overflow-hidden">
          <ChatSidebar
            messages={messages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            onAbortGeneration={abortGeneration}
            noProjectSelected={!currentProjectId}
            onCreateProject={() => setIsNewProjectModalOpen(true)}
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
                  directory={currentProject?.directory || ""}
                  isGenerating={isGenerating}
                  onTabActivated={() => {
                    // Only check status when preview tab is activated and NOT generating
                    if (currentProject?.directory && !isGenerating) {
                      // Status check will happen inside the component
                    }
                  }}
                />
              ) : activeTab === "project-files" ? (
                <ProjectFilesTab projectName={currentProject?.directory || ""} />
              ) : activeTab === "deployments" ? (
                <DeploymentsTab />
              ) : (
                <CodeView code={codeContent} isGenerating={isGenerating} />
              )}
            </div>
          </div>
        </div>

        {showWelcome && (
          <div className={isExiting ? "welcome-overlay-exit welcome-overlay-exit-active" : ""}>
            <WelcomeScreen onStart={handleStart} />
          </div>
        )}

        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onCreateProject={createProject}
        />
      </div>
    </ThemeProvider>
  )
}

