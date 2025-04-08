export interface Project {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  directory: string
  websiteContent: string
  codeContent: string
  messages: {
    role: "user" | "assistant" | "git"
    content: string
    action?: string
    hash?: string
  }[]
  status?: "running" | "stopped" | "exited"
  port?: number | null
}

export type ProjectSummary = Pick<Project, "id" | "name" | "description" | "createdAt" | "updatedAt" | "directory">
