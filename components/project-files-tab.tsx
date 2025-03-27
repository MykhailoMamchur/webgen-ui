"use client"

import { useState, useEffect } from "react"
import { Loader2, Folder, ChevronRight, ChevronDown, FileCode, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectFilesTabProps {
  projectName: string
}

interface FileNode {
  name: string
  path: string
  type: "file" | "directory"
  content?: string
  children?: FileNode[]
}

export default function ProjectFilesTab({ projectName }: ProjectFilesTabProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [instructions, setInstructions] = useState<string>("")
  const [fileTree, setFileTree] = useState<FileNode[]>([])
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Load instructions when the component mounts or projectName changes
  useEffect(() => {
    if (!projectName) return

    const loadInstructions = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/instructions/load", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_name: projectName,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to load instructions: ${response.status}`)
        }

        const data = await response.json()

        if (data.instructions) {
          setInstructions(data.instructions)
          const parsedFiles = parseInstructionsToFiles(data.instructions)
          const tree = buildFileTree(parsedFiles)
          setFileTree(tree)

          // Select the first file if available
          if (parsedFiles.length > 0) {
            setSelectedFile(parsedFiles[0])
          }
        } else {
          setInstructions("")
          setFileTree([])
          setSelectedFile(null)
        }
      } catch (error) {
        console.error("Error loading instructions:", error)
        setError((error as Error).message || "Failed to load instructions")
      } finally {
        setIsLoading(false)
      }
    }

    loadInstructions()
  }, [projectName])

  // Parse instructions to extract file information
  const parseInstructionsToFiles = (instructions: string): FileNode[] => {
    const files: FileNode[] = []
    const fileActionRegex =
      /<webgen_action\s+type="(create_file|edit_file)"\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/webgen_action>/g

    let match
    while ((match = fileActionRegex.exec(instructions)) !== null) {
      const type = match[1]
      const path = match[2]
      const content = match[3]

      // Only include create_file and edit_file actions
      if (type === "create_file" || type === "edit_file") {
        files.push({
          name: path.split("/").pop() || "",
          path,
          type: "file",
          content,
        })
      }
    }

    return files
  }

  // Build a hierarchical file tree from flat file list
  const buildFileTree = (files: FileNode[]): FileNode[] => {
    const root: FileNode[] = []
    const map: Record<string, FileNode> = {}

    // First pass: create all directories
    files.forEach((file) => {
      const pathParts = file.path.split("/")
      let currentPath = ""

      pathParts.forEach((part, index) => {
        const isLastPart = index === pathParts.length - 1
        currentPath = currentPath ? `${currentPath}/${part}` : part

        if (!map[currentPath]) {
          const newNode: FileNode = {
            name: part,
            path: currentPath,
            type: isLastPart ? "file" : "directory",
            children: isLastPart ? undefined : [],
          }

          map[currentPath] = newNode

          if (index === 0) {
            root.push(newNode)
          } else {
            const parentPath = pathParts.slice(0, index).join("/")
            if (map[parentPath] && map[parentPath].children) {
              map[parentPath].children!.push(newNode)
            }
          }
        }
      })
    })

    // Second pass: add file content
    files.forEach((file) => {
      if (map[file.path]) {
        map[file.path].content = file.content
      }
    })

    // Sort the tree: directories first, then files, both alphabetically
    const sortTree = (nodes: FileNode[]) => {
      nodes.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name)
        }
        return a.type === "directory" ? -1 : 1
      })

      nodes.forEach((node) => {
        if (node.children) {
          sortTree(node.children)
        }
      })
    }

    sortTree(root)
    return root
  }

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  // Recursively render the file tree
  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.path)

      if (node.type === "directory") {
        return (
          <div key={node.path}>
            <div
              className={cn(
                "flex items-center py-1 px-2 hover:bg-purple-500/10 cursor-pointer",
                "transition-colors rounded-md",
              )}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
              onClick={() => toggleFolder(node.path)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
              )}
              <Folder className="h-4 w-4 text-purple-400 mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-200 truncate">{node.name}</span>
            </div>
            {isExpanded && node.children && <div className="ml-2">{renderFileTree(node.children, level + 1)}</div>}
          </div>
        )
      } else {
        // Determine file icon based on extension
        const extension = node.name.split(".").pop()?.toLowerCase() || ""
        let FileIcon = FileText

        if (["js", "jsx", "ts", "tsx"].includes(extension)) {
          FileIcon = FileCode
        }

        return (
          <div
            key={node.path}
            className={cn(
              "flex items-center py-1 px-2 hover:bg-purple-500/10 cursor-pointer",
              "transition-colors rounded-md",
              selectedFile?.path === node.path && "bg-purple-500/20",
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => setSelectedFile(node)}
          >
            <FileIcon className="h-4 w-4 text-blue-400 mr-2 ml-5 flex-shrink-0" />
            <span className="text-sm text-gray-200 truncate">{node.name}</span>
          </div>
        )
      }
    })
  }

  // Determine file type for syntax highlighting
  const getFileType = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "js":
        return "javascript"
      case "jsx":
        return "jsx"
      case "ts":
        return "typescript"
      case "tsx":
        return "jsx" // Use jsx for tsx as well
      case "html":
        return "html"
      case "css":
        return "css"
      case "scss":
        return "css" // Use css for scss
      case "json":
        return "json"
      default:
        return "javascript" // Default to javascript for other types
    }
  }

  return (
    <div className="flex-1 bg-[#0A090F] flex h-full overflow-hidden">
      {/* Left panel - File tree with fixed width */}
      <div className="w-64 min-w-[16rem] flex-shrink-0 border-r border-purple-900/20 bg-[#13111C] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-400">{error}</div>
        ) : fileTree.length === 0 ? (
          <div className="p-4 text-sm text-gray-400">No files found</div>
        ) : (
          <div className="p-2">{renderFileTree(fileTree)}</div>
        )}
      </div>

      {/* Right panel - File content that takes remaining space */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {selectedFile ? (
          <div className="h-full p-4">
            <div className="bg-[#13111C] rounded-lg border border-purple-900/20 overflow-hidden h-full flex flex-col">
              <div className="flex items-center gap-2 p-3 border-b border-purple-900/20 bg-[#1A1825]">
                <FileCode className="h-4 w-4 text-blue-400" />
                <span className="font-mono text-sm text-gray-200 truncate">{selectedFile.path}</span>
              </div>
              <div className="bg-[#1E1A29] overflow-auto flex-1">
                <pre className="p-4 text-sm font-mono text-gray-300 min-w-max">
                  <code>
                    {selectedFile.content?.split("\n").map((line, i) => (
                      <div key={i} className="flex hover:bg-purple-500/10">
                        <span className="text-gray-500 select-none mr-4 inline-block w-8 text-right">{i + 1}</span>
                        <span>{line || " "}</span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Select a file to view its content
          </div>
        )}
      </div>
    </div>
  )
}

