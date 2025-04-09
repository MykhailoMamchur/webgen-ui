"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Clipboard, Check, Loader2, FileCode, Edit, Replace, AlertTriangle, Trash2 } from "lucide-react"

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

// Function to extract file actions from logs, including partial actions
const extractFileActionsFromLogs = (logs: string, isGenerating: boolean): React.ReactNode[] => {
  if (!logs) return []

  const result: React.ReactNode[] = []

  // First, try to extract complete file actions
  const completeActionRegex = /<webgen_action\s+type="([^"]+)"\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/webgen_action>/g

  let match
  let lastIndex = 0
  let hasPartialAction = false

  while ((match = completeActionRegex.exec(logs)) !== null) {
    // Add text before the match as plain text with preserved newlines
    if (match.index > lastIndex) {
      const textBefore = logs.substring(lastIndex, match.index)
      if (textBefore.trim()) {
        // Escape HTML characters in regular text
        const escapedText = textBefore.replace(/</g, "&lt;").replace(/>/g, "&gt;")

        result.push(
          <div
            key={`text-${result.length}`}
            className="font-mono text-sm text-gray-300 my-2 whitespace-pre"
            dangerouslySetInnerHTML={{
              __html: convertAnsiToHtml(escapedText).replace(/\n/g, "<br />"),
            }}
          />,
        )
      }
    }

    const actionType = match[1]
    const fileName = match[2]
    const actionContent = match[3]

    // Extract find/replace content if applicable
    let findContent = ""
    let replaceContent = ""

    if (actionType === "content_replace") {
      const findMatch = /<webgen_subaction\s+type="find"[^>]*>([\s\S]*?)<\/webgen_subaction>/g.exec(actionContent)
      const replaceMatch = /<webgen_subaction\s+type="replace"[^>]*>([\s\S]*?)<\/webgen_subaction>/g.exec(actionContent)

      if (findMatch) findContent = findMatch[1]
      if (replaceMatch) replaceContent = replaceMatch[1]
    }

    // Extract issue details if applicable
    let issueCategory = ""
    let issueDescription = ""

    if (actionType === "report_issue") {
      const categoryMatch = match[0].match(/issue_category="([^"]+)"/)
      const descriptionMatch = match[0].match(/issue_description="([^"]+)"/)

      if (categoryMatch) issueCategory = categoryMatch[1]
      if (descriptionMatch) issueDescription = descriptionMatch[1]

      if (!issueDescription) issueDescription = actionContent
    }

    // Add the file action
    if (actionType === "create_file" || actionType === "edit_file") {
      result.push(
        <FileAction
          key={`action-${result.length}`}
          type={actionType as "create_file" | "edit_file"}
          fileName={fileName}
          content={actionContent}
        />,
      )
    } else if (actionType === "delete_file") {
      result.push(<FileAction key={`action-${result.length}`} type="delete_file" fileName={fileName} />)
    } else if (actionType === "content_replace") {
      result.push(
        <FileAction
          key={`action-${result.length}`}
          type="content_replace"
          fileName={fileName}
          findContent={findContent}
          replaceContent={replaceContent}
        />,
      )
    } else if (actionType === "report_issue") {
      result.push(
        <FileAction
          key={`action-${result.length}`}
          type="report_issue"
          issueCategory={issueCategory || "Unknown Issue"}
          issueDescription={issueDescription || actionContent}
        />,
      )
    }

    lastIndex = match.index + match[0].length
  }

  // If we're still generating, look for partial actions
  if (isGenerating) {
    // Look for an opening tag after the last complete action
    const remainingText = logs.substring(lastIndex)
    const partialActionMatch = /<webgen_action\s+type="([^"]+)"\s+name="([^"]+)"[^>]*>/.exec(remainingText)

    if (partialActionMatch) {
      hasPartialAction = true
      const actionType = partialActionMatch[1] as "create_file" | "edit_file" | "content_replace" | "report_issue"
      const fileName = partialActionMatch[2]

      // Get the content after the opening tag
      const openingTagEndIndex = partialActionMatch.index + partialActionMatch[0].length
      const partialContent = remainingText.substring(openingTagEndIndex)

      // Add text before the partial action with preserved newlines
      if (partialActionMatch.index > 0) {
        const textBefore = remainingText.substring(0, partialActionMatch.index)
        if (textBefore.trim()) {
          // Escape HTML characters in regular text
          const escapedText = textBefore.replace(/</g, "&lt;").replace(/>/g, "&gt;")

          result.push(
            <div
              key={`text-${result.length}`}
              className="font-mono text-sm text-gray-300 my-2 whitespace-pre"
              dangerouslySetInnerHTML={{
                __html: convertAnsiToHtml(escapedText).replace(/\n/g, "<br />"),
              }}
            />,
          )
        }
      }

      // Add the partial file action
      if (actionType === "create_file" || actionType === "edit_file") {
        result.push(
          <FileAction
            key={`partial-action-${result.length}`}
            type={actionType}
            fileName={fileName}
            content={partialContent}
            isPartial={true}
          />,
        )
      } else if (actionType === "delete_file") {
        result.push(
          <FileAction
            key={`partial-action-${result.length}`}
            type="delete_file"
            fileName={fileName}
            isPartial={true}
          />,
        )
      } else if (actionType === "content_replace") {
        // For content_replace, we need to check if there are partial subactions
        const findMatch = /<webgen_subaction\s+type="find"[^>]*>([\s\S]*?)(?:<\/webgen_subaction>|$)/.exec(
          partialContent,
        )
        const findContent = findMatch ? findMatch[1] : ""

        let replaceContent = ""
        if (findMatch) {
          const findEndIndex = findMatch.index + findMatch[0].length
          const afterFind = partialContent.substring(findEndIndex)
          const replaceMatch = /<webgen_subaction\s+type="replace"[^>]*>([\s\S]*?)(?:<\/webgen_subaction>|$)/.exec(
            afterFind,
          )
          if (replaceMatch) {
            replaceContent = replaceMatch[1]
          }
        }

        result.push(
          <FileAction
            key={`partial-action-${result.length}`}
            type="content_replace"
            fileName={fileName}
            findContent={findContent}
            replaceContent={replaceContent}
            isPartial={true}
          />,
        )
      } else if (actionType === "report_issue") {
        const categoryMatch = partialActionMatch[0].match(/issue_category="([^"]+)"/)
        const descriptionMatch = partialActionMatch[0].match(/issue_description="([^"]+)"/)

        result.push(
          <FileAction
            key={`partial-action-${result.length}`}
            type="report_issue"
            issueCategory={categoryMatch ? categoryMatch[1] : "Unknown Issue"}
            issueDescription={descriptionMatch ? descriptionMatch[1] : partialContent}
            isPartial={true}
          />,
        )
      }
    }
  }

  // Add any remaining text as plain text with preserved newlines
  // Only if there's no partial action or we're not generating
  if (!hasPartialAction && lastIndex < logs.length) {
    const remainingText = logs.substring(lastIndex)
    if (remainingText.trim()) {
      // Escape HTML characters in regular text
      const escapedText = remainingText.replace(/</g, "&lt;").replace(/>/g, "&gt;")

      result.push(
        <div
          key={`text-${result.length}`}
          className="font-mono text-sm text-gray-300 my-2 whitespace-pre"
          dangerouslySetInnerHTML={{
            __html: convertAnsiToHtml(escapedText).replace(/\n/g, "<br />"),
          }}
        />,
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
