"use client"

import { Sparkles, Upload, Settings, User, ChevronDown, LogOut, Menu } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ProjectSelector from "@/components/project-selector"
import type { ProjectSummary } from "@/types/project"
import PromptsModal from "@/components/prompts-modal"
import { logoutUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface HeaderProps {
  currentProject: ProjectSummary | null
  projects: ProjectSummary[]
  onSelectProject: (projectId: string) => void
  onNewProject: () => void
  onDeleteProject: (projectId: string) => Promise<void>
  onRenameProject?: (projectId: string, newName: string) => void
  isGenerating?: boolean
  onDeploy?: () => void
  onOpenPrompts?: () => void
}

interface UserData {
  id: string
  email: string
  name?: string
}

export default function Header({
  currentProject,
  projects,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onRenameProject,
  isGenerating = false,
  onDeploy,
  onOpenPrompts,
}: HeaderProps) {
  const [isPromptsModalOpen, setIsPromptsModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const router = useRouter()

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoadingUser(true)
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setUserData(data)
        } else {
          console.error("Failed to fetch user data")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchUserData()
  }, [])

  const handleOpenPromptsModal = () => {
    if (onOpenPrompts) {
      onOpenPrompts()
    } else {
      setIsPromptsModalOpen(true)
    }
  }

  const handleSignOut = async () => {
    try {
      await logoutUser()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (userData?.name) {
      return userData.name.charAt(0).toUpperCase()
    } else if (userData?.email) {
      return userData.email.charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <header className="border-b border-purple-900/20 bg-gradient-to-r from-[#13111C] to-[#1A1A1A] h-16 flex items-center px-4 md:px-6 sticky top-0 z-10 shadow-md">
      <div className="flex items-center">
        <div className="flex items-center gap-2 mr-6">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h1 className="text-xl font-semibold tracking-tight text-white">manufactura</h1>
        </div>

        <div className="hidden md:block">
          <ProjectSelector
            currentProject={currentProject}
            projects={projects}
            onSelectProject={onSelectProject}
            onNewProject={onNewProject}
            onDeleteProject={onDeleteProject}
            onRenameProject={onRenameProject}
            isGenerating={isGenerating}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <TooltipProvider>
          <div className="hidden md:flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleOpenPromptsModal}
                  disabled={isGenerating}
                  className="h-9 w-9 rounded-full text-gray-300 hover:text-white hover:bg-purple-500/20 disabled:opacity-50"
                >
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Prompts</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Manage Prompts</p>
              </TooltipContent>
            </Tooltip>

            <Button
              variant="default"
              size="sm"
              onClick={onDeploy}
              disabled={!currentProject || isGenerating}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full px-4"
            >
              <Upload className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 rounded-full px-2 text-sm text-gray-300 hover:text-white hover:bg-purple-500/20"
            >
              <Avatar className="h-7 w-7 mr-2 border border-purple-500/30">
                <AvatarFallback className="bg-purple-900/30 text-purple-200 text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block max-w-[150px] truncate">
                {isLoadingUser ? "Loading..." : userData?.email || "User"}
              </span>
              <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#252525] border-purple-500/20 text-white">
            <DropdownMenuLabel className="text-gray-400">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-purple-500/10" />
            <DropdownMenuItem className="hover:bg-purple-500/20 focus:bg-purple-500/20 cursor-pointer">
              <User className="h-4 w-4 mr-2 text-purple-400" />
              Profile Settings
            </DropdownMenuItem>

            <DropdownMenuItem
              className="hover:bg-purple-500/20 focus:bg-purple-500/20 cursor-pointer md:hidden"
              onClick={handleOpenPromptsModal}
            >
              <Settings className="h-4 w-4 mr-2 text-purple-400" />
              Manage Prompts
            </DropdownMenuItem>

            <DropdownMenuItem
              className="hover:bg-purple-500/20 focus:bg-purple-500/20 cursor-pointer md:hidden"
              onClick={onDeploy}
              disabled={!currentProject || isGenerating}
            >
              <Upload className="h-4 w-4 mr-2 text-purple-400" />
              Publish Website
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-purple-500/10" />
            <DropdownMenuItem
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!onOpenPrompts && <PromptsModal isOpen={isPromptsModalOpen} onClose={() => setIsPromptsModalOpen(false)} />}
    </header>
  )
}
