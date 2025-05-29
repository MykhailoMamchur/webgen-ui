"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Clipboard, Check, Loader2, FileCode, Edit, Replace, AlertTriangle, Trash2, Brain } from "lucide-react"

interface CodeViewProps {
  code: string
  isGenerating?: boolean
}

// Helper function to convert ANSI color codes to HTML
const convertAnsiToHtml = (text: string) => {
  // Basic ANSI color code mapping to CSS classes
  const ansiToHtml = text
    // Reset
    .replace(/\u001b\[0m/g, "</span>")
    // Bold
    .replace(/\u001b\[1m/g, '<span class="font-bold">')
    // Underline
    .replace(/\u001b\[4m/g, '<span class="underline">')
    // Colors
    .replace(/\u001b\[30m/g, '<span class="text-black">')
    .replace(/\u001b\[31m/g, '<span class="text-red-500">')
    .replace(/\u001b\[32m/g, '<span class="text-green-500">')
    .replace(/\u001b\[33m/g, '<span class="text-yellow-500">')
    .replace(/\u001b\[34m/g, '<span class="text-blue-500">')
    .replace(/\u001b\[35m/g, '<span class="text-purple-500">')
    .replace(/\u001b\[36m/g, '<span class="text-cyan-500">')
    .replace(/\u001b\[37m/g, '<span class="text-white">')
    // Bright colors
    .replace(/\u001b\[90m/g, '<span class="text-gray-500">')
    .replace(/\u001b\[91m/g, '<span class="text-red-400">')
    .replace(/\u001b\[92m/g, '<span class="text-green-400">')
    .replace(/\u001b\[93m/g, '<span class="text-yellow-400">')
    .replace(/\u001b\[94m/g, '<span class="text-blue-400">')
    .replace(/\u001b\[95m/g, '<span class="text-purple-400">')
    .replace(/\u001b\[96m/g, '<span class="text-cyan-400">')
    .replace(/\u001b\[97m/g, '<span class="text-white">')
    // Background colors
    .replace(/\u001b\[40m/g, '<span class="bg-black">')
    .replace(/\u001b\[41m/g, '<span class="bg-red-900">')
    .replace(/\u001b\[42m/g, '<span class="bg-green-900">')
    .replace(/\u001b\[43m/g, '<span class="bg-yellow-900">')
    .replace(/\u001b\[44m/g, '<span class="bg-blue-900">')
    .replace(/\u001b\[45m/g, '<span class="bg-purple-900">')
    .replace(/\u001b\[46m/g, '<span class="bg-cyan-900">')
    .replace(/\u001b\[47m/g, '<span class="bg-white text-black">')
    // Other ANSI codes (just remove them)
    .replace(/\u001b\[\d+m/g, "")

  return ansiToHtml
}

// Component to display a file action
interface FileActionProps {
  type: "create_file" | "edit_file" | "content_replace" | "report_issue" | "delete_file"
  fileName?: string
  content?: string
  findContent?: string
  replaceContent?: string
  issueCategory?: string
  issueDescription?: string
  isPartial?: boolean
}

const FileAction = ({
  type,
  fileName,
  content,
  findContent,
  replaceContent,
  issueCategory,
  issueDescription,
  isPartial = false,
}: FileActionProps) => {
  if (type === "report_issue") {
    return (
      <div className="my-2 bg-[#13111C] rounded-lg border border-yellow-500/30 overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 p-2 border-b border-yellow-500/20 bg-[#1A1825]">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <span className="font-medium text-sm text-yellow-200">Issue Reported: {issueCategory}</span>
        </div>
        <div className="p-3 text-sm font-mono overflow-auto bg-[#1E1A29]">
          <pre className="whitespace-pre min-w-max">
            <code>
              {(issueDescription || "").split("\n").map((line, i) => (
                <div key={i} className="flex hover:bg-purple-500/5">
                  <span className="text-gray-500 select-none mr-4 inline-block w-8 text-right">{i + 1}</span>
                  <span>{line || " "}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    )
  }

  // Render header
  const renderHeader = () => (
    <div className="flex items-center gap-2 p-2 border-b border-purple-900/20 bg-[#1A1825]">
      {type === "create_file" && <FileCode className="h-4 w-4 text-green-400" />}
      {type === "edit_file" && <Edit className="h-4 w-4 text-blue-400" />}
      {type === "content_replace" && <Replace className="h-4 w-4 text-yellow-400" />}
      {type === "delete_file" && <Trash2 className="h-4 w-4 text-red-400" />}

      <span className="font-mono text-sm text-gray-200 px-1">{fileName}</span>

      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-300">
        {type === "create_file"
          ? "Created"
          : type === "edit_file"
            ? "Edited"
            : type === "delete_file"
              ? "Deleted"
              : "Modified"}
      </span>
    </div>
  )

  // Render content with line numbers and horizontal scrolling
  const renderContent = (content: string) => {
    return (
      <div className="p-3 text-sm font-mono overflow-auto bg-[#1E1A29]">
        <pre className="whitespace-pre min-w-max">
          <code>
            {content.split("\n").map((line, i) => (
              <div key={i} className="flex hover:bg-purple-500/5">
                <span className="text-gray-500 select-none mr-4 inline-block w-8 text-right">{i + 1}</span>
                <span>{line || " "}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    )
  }

  // For delete_file, we want to show a special UI that indicates the file is being deleted
  if (type === "delete_file") {
    return (
      <div className="my-2 bg-[#13111C] rounded-lg border border-red-500/30 overflow-hidden shadow-sm">
        {renderHeader()}
        <div className="p-3 text-sm font-mono bg-[#1E1A29] text-gray-300 flex items-center justify-center">
          <Trash2 className="h-5 w-5 text-red-400 mr-2" />
          <span>This file has been deleted</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`my-2 bg-[#13111C] rounded-lg border ${isPartial ? "border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.15)]" : "border-purple-900/20"} overflow-hidden shadow-sm transition-all duration-200`}
    >
      {renderHeader()}

      {type === "content_replace" ? (
        <div>
          {findContent && (
            <div className="border-b border-purple-900/20">
              <div className="px-3 py-1 text-xs text-red-300 bg-red-900/10 border-l-2 border-red-500">Find</div>
              {renderContent(findContent)}
            </div>
          )}
          {replaceContent && (
            <div>
              <div className="px-3 py-1 text-xs text-green-300 bg-green-900/10 border-l-2 border-green-500">
                Replace
              </div>
              {renderContent(replaceContent)}
            </div>
          )}
        </div>
      ) : (
        renderContent(content || "")
      )}
    </div>
  )
}

// Component to display logs artifact
interface LogsArtifactProps {
  content: string
  isPartial?: boolean
}

const LogsArtifact = ({ content, isPartial = false }: LogsArtifactProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={`my-2 bg-[#13111C] rounded-lg border ${isPartial ? "border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.15)]" : "border-red-900/20"} overflow-hidden shadow-sm transition-all duration-200`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-2 border-b border-red-900/20 bg-[#1A1825] hover:bg-[#1F1A2A] transition-colors"
      >
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <span className="font-medium text-sm text-red-200">Error Logs</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-300">
          {isExpanded ? "Collapse" : "Expand"}
        </span>
      </button>

      {isExpanded && (
        <div className="p-3 text-sm font-mono overflow-auto bg-[#1E1A29] max-h-96">
          <pre className="whitespace-pre-wrap text-red-300">{content}</pre>
        </div>
      )}
    </div>
  )
}

// Component to display thinking artifact
interface ThinkingArtifactProps {
  content: string
  isPartial?: boolean
}

const ThinkingArtifact = ({ content, isPartial = false }: ThinkingArtifactProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={`my-2 bg-[#13111C] rounded-lg border ${isPartial ? "border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]" : "border-blue-900/20"} overflow-hidden shadow-sm transition-all duration-200`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-2 border-b border-blue-900/20 bg-[#1A1825] hover:bg-[#1F1A2A] transition-colors"
      >
        <Brain className="h-4 w-4 text-blue-400" />
        <span className="font-medium text-sm text-blue-200">Thinking...</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-300">
          {isExpanded ? "Collapse" : "Expand"}
        </span>
      </button>

      {isExpanded && (
        <div className="p-3 text-sm font-mono overflow-auto bg-[#1E1A29] max-h-96">
          <pre className="whitespace-pre-wrap text-blue-300">{content}</pre>
        </div>
      )}
    </div>
  )
}

// Unified function to extract all structured content from logs
const extractFileActionsFromLogs = (logs: string, isGenerating: boolean): React.ReactNode[] => {
  if (!logs) return []

  const result: React.ReactNode[] = []
  
  // Combined regex to find all structured tags in order
  const allTagsRegex = /<(webgen_action|webgen_artifact)\s+([^>]*)>([\s\S]*?)(?:<\/\1>|$)/g
  
  let lastIndex = 0
  let match
  
  // Process all complete and partial tags in sequential order
  while ((match = allTagsRegex.exec(logs)) !== null) {
    const [fullMatch, tagType, attributes, content] = match
    const isComplete = fullMatch.endsWith(`</${tagType}>`)
    const isPartial = isGenerating && !isComplete
    
    // Add any plain text before this tag
    if (match.index > lastIndex) {
      const textBefore = logs.substring(lastIndex, match.index)
      if (textBefore.trim()) {
        const escapedText = textBefore.replace(/</g, "&lt;").replace(/>/g, "&gt;")
        result.push(
          <div
            key={`text-${result.length}`}
            className="font-mono text-sm text-gray-300 my-2 whitespace-pre"
            dangerouslySetInnerHTML={{
              __html: convertAnsiToHtml(escapedText).replace(/\n/g, "<br />"),
            }}
          />
        )
      }
    }
    
    // Parse attributes
    const parseAttributes = (attrString: string) => {
      const attrs: Record<string, string> = {}
      const attrRegex = /(\w+)="([^"]*)"/g
      let attrMatch
      while ((attrMatch = attrRegex.exec(attrString)) !== null) {
        attrs[attrMatch[1]] = attrMatch[2]
      }
      return attrs
    }
    
    const attrs = parseAttributes(attributes)
    
    if (tagType === 'webgen_action') {
      const actionType = attrs.type as "create_file" | "edit_file" | "content_replace" | "report_issue" | "delete_file"
      const fileName = attrs.name
      
      if (actionType === "create_file" || actionType === "edit_file") {
        result.push(
          <FileAction
            key={`action-${result.length}`}
            type={actionType}
            fileName={fileName}
            content={content}
            isPartial={isPartial}
          />
        )
      } else if (actionType === "delete_file") {
        result.push(
          <FileAction
            key={`action-${result.length}`}
            type="delete_file"
            fileName={fileName}
            isPartial={isPartial}
          />
        )
      } else if (actionType === "content_replace") {
        // Extract find/replace content
        const findMatch = /<webgen_subaction\s+type="find"[^>]*>([\s\S]*?)(?:<\/webgen_subaction>|$)/.exec(content)
        const replaceMatch = /<webgen_subaction\s+type="replace"[^>]*>([\s\S]*?)(?:<\/webgen_subaction>|$)/.exec(content)
        
        const findContent = findMatch ? findMatch[1] : ""
        const replaceContent = replaceMatch ? replaceMatch[1] : ""
        
        result.push(
          <FileAction
            key={`action-${result.length}`}
            type="content_replace"
            fileName={fileName}
            findContent={findContent}
            replaceContent={replaceContent}
            isPartial={isPartial}
          />
        )
      } else if (actionType === "report_issue") {
        result.push(
          <FileAction
            key={`action-${result.length}`}
            type="report_issue"
            issueCategory={attrs.issue_category || "Unknown Issue"}
            issueDescription={attrs.issue_description || content}
            isPartial={isPartial}
          />
        )
      }
    } else if (tagType === 'webgen_artifact') {
      const artifactType = attrs.type
      
      if (artifactType === 'logs') {
        result.push(
          <LogsArtifact
            key={`logs-${result.length}`}
            content={content}
            isPartial={isPartial}
          />
        )
      } else if (artifactType === 'thinking') {
        result.push(
          <ThinkingArtifact
            key={`thinking-${result.length}`}
            content={content}
            isPartial={isPartial}
          />
        )
      }
    }
    
    // Update lastIndex only for complete tags
    if (isComplete) {
      lastIndex = match.index + fullMatch.length
    } else {
      // For partial tags, we don't want to process the remaining text
      // as it's part of the incomplete tag
      break
    }
  }
  
  // Add any remaining text only if we're not in the middle of a partial tag
  if (lastIndex < logs.length && (!isGenerating || !logs.substring(lastIndex).includes('<webgen_'))) {
    const remainingText = logs.substring(lastIndex)
    if (remainingText.trim()) {
      const escapedText = remainingText.replace(/</g, "&lt;").replace(/>/g, "&gt;")
      result.push(
        <div
          key={`text-${result.length}`}
          className="font-mono text-sm text-gray-300 my-2 whitespace-pre"
          dangerouslySetInnerHTML={{
            __html: convertAnsiToHtml(escapedText).replace(/\n/g, "<br />"),
          }}
        />
      )
    }
  }
  
  return result
}

export default function GenerationCodeView({ code, isGenerating = false }: CodeViewProps) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [userScrolled, setUserScrolled] = useState(false)
  const [previousCode, setPreviousCode] = useState("")
  const [parsedContent, setParsedContent] = useState<React.ReactNode[]>([])

  const copyToClipboard = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Handle scroll events to detect if user has scrolled up
  const handleScroll = () => {
    if (!codeRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = codeRef.current
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50

    if (!isAtBottom && !userScrolled) {
      setUserScrolled(true)
      setShouldAutoScroll(false)
    } else if (isAtBottom && userScrolled) {
      setUserScrolled(false)
      setShouldAutoScroll(true)
    }
  }

  // Process the code when it changes
  useEffect(() => {
    if (!code) {
      setParsedContent([])
      setPreviousCode("")
      return
    }

    // Only process if code has changed
    if (code === previousCode) return

    // Parse the code, including partial actions if still generating
    const extractedContent = extractFileActionsFromLogs(code, isGenerating)
    setParsedContent(extractedContent)
    setPreviousCode(code)
  }, [code, previousCode, isGenerating])

  // Auto-scroll to bottom when new content is added, but only if user hasn't scrolled up
  useEffect(() => {
    if (codeRef.current && shouldAutoScroll) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight
    }
  }, [parsedContent, shouldAutoScroll])

  return (
    <div className="flex-1 bg-[#0A090F] flex flex-col h-full overflow-hidden">
      <div className="sticky top-0 z-[5] bg-[#0A090F] border-b border-purple-900/20">
        {isGenerating && (
          <div className="flex items-center text-purple-400 text-sm font-medium py-2 px-4">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </div>
        )}
      </div>

      <div className="relative w-full h-full overflow-auto" ref={codeRef} onScroll={handleScroll}>
        <button
          onClick={copyToClipboard}
          className="absolute top-4 right-4 p-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 transition-colors z-20"
          aria-label="Copy code"
          disabled={!code || isGenerating}
        >
          {copied ? <Check className="h-5 w-5" /> : <Clipboard className="h-5 w-5" />}
        </button>

        {code || isGenerating ? (
          <div className="prose prose-invert max-w-none p-4">{parsedContent}</div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No content generated yet. Start a conversation to generate content.
          </div>
        )}
      </div>
    </div>
  )
}