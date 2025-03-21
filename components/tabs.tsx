"use client"
import { cn } from "@/lib/utils"

interface TabsProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

// Update the Tabs component to disable the preview tab during generation
export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
  isGenerating = false,
}: TabsProps & { isGenerating?: boolean }) {
  return (
    <div className={cn("flex border-b border-purple-900/20 w-full", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => (!isGenerating || tab.id !== "preview" ? onChange(tab.id) : null)}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors relative",
            activeTab === tab.id ? "text-purple-400" : "text-muted-foreground hover:text-purple-300",
            isGenerating && tab.id === "preview" ? "opacity-50 cursor-not-allowed" : "",
          )}
          disabled={isGenerating && tab.id === "preview"}
        >
          {tab.label}
          {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />}
        </button>
      ))}
    </div>
  )
}

