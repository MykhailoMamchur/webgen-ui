"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Clipboard, Check, Loader2, FileCode, Edit, Replace, AlertTriangle } from "lucide-react"

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
  type: "create_file" | "edit_file" | "content_replace" | "report_issue"
  fileName?: string
  content?: string
  findContent?: string
  replaceContent?: string
  issueCategory?: string
  issueDescription?: string
}

const FileAction = ({
  type,
  fileName,
  content,
  findContent,
  replaceContent,
  issueCategory,
  issueDescription,
}: FileActionProps) => {
  if (type === "report_issue") {
    return (
      <div className="my-2 bg-[#13111C] rounded-lg border border-yellow-500/30 overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b border-yellow-500/20 bg-[#1A1825]">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <span className="font-medium text-sm text-yellow-200">Issue Reported: {issueCategory}</span>
        </div>
        <div className="p-4 text-sm font-mono whitespace-pre-wrap text-gray-300 overflow-auto">{issueDescription}</div>
      </div>
    )
  }

  return (
    <div className="my-2 bg-[#13111C] rounded-lg border border-purple-900/20 overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-purple-900/20 bg-[#1A1825]">
        {type === "create_file" && <FileCode className="h-4 w-4 text-green-400" />}
        {type === "edit_file" && <Edit className="h-4 w-4 text-blue-400" />}
        {type === "content_replace" && <Replace className="h-4 w-4 text-yellow-400" />}

        <span className="font-mono text-sm text-gray-200">{fileName}</span>

        <span className="ml-auto text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-300">
          {type === "create_file" ? "Created" : type === "edit_file" ? "Edited" : "Modified"}
        </span>
      </div>

      {type === "content_replace" ? (
        <div>
          {findContent && (
            <div className="border-b border-purple-900/20">
              <div className="px-3 py-1 text-xs text-red-300 bg-red-900/10 border-l-2 border-red-500">Find</div>
              <div className="p-4 text-sm font-mono whitespace-pre-wrap text-gray-300 overflow-auto">{findContent}</div>
            </div>
          )}
          {replaceContent && (
            <div>
              <div className="px-3 py-1 text-xs text-green-300 bg-green-900/10 border-l-2 border-green-500">
                Replace
              </div>
              <div className="p-4 text-sm font-mono whitespace-pre-wrap text-gray-300 overflow-auto">
                {replaceContent}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-sm font-mono whitespace-pre-wrap text-gray-300 overflow-auto">{content}</div>
      )}
    </div>
  )
}

export default function CodeView({ code, isGenerating = false }: CodeViewProps) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [userScrolled, setUserScrolled] = useState(false)
  const [previousCode, setPreviousCode] = useState("")
  const [parsedContent, setParsedContent] = useState<React.ReactNode[]>([])
  const [textContent, setTextContent] = useState("")

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

  // Process the code only when it changes
  useEffect(() => {
    if (!code) {
      setParsedContent([])
      setTextContent("")
      setPreviousCode("")
      return
    }

    // Only process the new part of the code
    if (code === previousCode) return

    const result: React.ReactNode[] = []
    let currentText = ""
    let i = 0
    let inAction = false
    let actionType = ""
    let actionName = ""
    let actionContent = ""
    let issueCategory = ""
    let issueDescription = ""
    let inSubAction = false
    let subActionType = ""
    let findContent = ""
    let replaceContent = ""

    // Helper function to process tags
    const processTag = (startIndex: number, tag: string) => {
      // Extract info from tag
      if (tag.startsWith("<webgen_action")) {
        inAction = true
        const typeMatch = tag.match(/type="([^"]+)"/)
        actionType = typeMatch ? typeMatch[1] : ""

        const nameMatch = tag.match(/name="([^"]+)"/)
        actionName = nameMatch ? nameMatch[1] : ""

        const categoryMatch = tag.match(/issue_category="([^"]+)"/)
        issueCategory = categoryMatch ? categoryMatch[1] : ""

        const descriptionMatch = tag.match(/issue_description="([^"]+)"/)
        issueDescription = descriptionMatch ? descriptionMatch[1] : ""

        // Add any text before the tag to the result
        if (currentText) {
          result.push(
            <div
              key={`text-${result.length}`}
              className="font-mono text-sm text-gray-300 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: convertAnsiToHtml(currentText) }}
            />,
          )
          currentText = ""
        }

        return tag.length
      } else if (tag === "</webgen_action>") {
        inAction = false

        // Add the action to the result
        if (actionType === "create_file" || actionType === "edit_file") {
          result.push(
            <FileAction
              key={`action-${result.length}`}
              type={actionType as "create_file" | "edit_file"}
              fileName={actionName}
              content={actionContent}
            />,
          )
        } else if (actionType === "content_replace") {
          result.push(
            <FileAction
              key={`action-${result.length}`}
              type="content_replace"
              fileName={actionName}
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

        // Reset action variables
        actionType = ""
        actionName = ""
        actionContent = ""
        issueCategory = ""
        issueDescription = ""
        findContent = ""
        replaceContent = ""

        return tag.length
      } else if (tag.startsWith("<webgen_subaction")) {
        inSubAction = true
        const typeMatch = tag.match(/type="([^"]+)"/)
        subActionType = typeMatch ? typeMatch[1] : ""
        return tag.length
      } else if (tag === "</webgen_subaction>") {
        inSubAction = false

        // Process completed subaction
        if (subActionType === "find") {
          findContent = actionContent
        } else if (subActionType === "replace") {
          replaceContent = actionContent
        }

        actionContent = ""
        subActionType = ""

        return tag.length
      }

      return 0
    }

    while (i < code.length) {
      // Look for tags
      if (!inAction) {
        const actionTagStart = code.indexOf("<webgen_action", i)

        if (actionTagStart !== -1) {
          // Add text before the tag
          currentText += code.substring(i, actionTagStart)

          // Find the end of the tag
          const tagEndIndex = code.indexOf(">", actionTagStart)
          if (tagEndIndex !== -1) {
            const tag = code.substring(actionTagStart, tagEndIndex + 1)
            i = actionTagStart + processTag(actionTagStart, tag)
          } else {
            // Incomplete tag, treat as text
            currentText += code.substring(i)
            break
          }
        } else {
          // No more tags, add remaining text
          currentText += code.substring(i)
          break
        }
      } else {
        // Already in an action, look for end tags or sub-action tags
        if (!inSubAction) {
          const subActionStart = code.indexOf("<webgen_subaction", i)
          const actionEnd = code.indexOf("</webgen_action>", i)

          if (subActionStart !== -1 && (actionEnd === -1 || subActionStart < actionEnd)) {
            // Add text before the sub-action tag
            actionContent += code.substring(i, subActionStart)

            // Find the end of the tag
            const tagEndIndex = code.indexOf(">", subActionStart)
            if (tagEndIndex !== -1) {
              const tag = code.substring(subActionStart, tagEndIndex + 1)
              i = subActionStart + processTag(subActionStart, tag)
            } else {
              // Incomplete tag, treat as text
              actionContent += code.substring(i)
              break
            }
          } else if (actionEnd !== -1) {
            // Add text before the end tag
            actionContent += code.substring(i, actionEnd)

            // Process the end tag
            i = actionEnd + processTag(actionEnd, "</webgen_action>")
          } else {
            // No more tags, add remaining text
            actionContent += code.substring(i)
            break
          }
        } else {
          // In a sub-action, look for end tag
          const subActionEnd = code.indexOf("</webgen_subaction>", i)

          if (subActionEnd !== -1) {
            // Add text before the end tag
            actionContent += code.substring(i, subActionEnd)

            // Process the end tag
            i = subActionEnd + processTag(subActionEnd, "</webgen_subaction>")
          } else {
            // No end tag, add remaining text
            actionContent += code.substring(i)
            break
          }
        }
      }
    }

    // Add any remaining text to the result
    if (currentText) {
      result.push(
        <div
          key={`text-${result.length}`}
          className="font-mono text-sm text-gray-300 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: convertAnsiToHtml(currentText) }}
        />,
      )
    }

    setTextContent(currentText)
    setParsedContent(result)
    setPreviousCode(code)
  }, [code, previousCode])

  // Auto-scroll to bottom when new content is added, but only if user hasn't scrolled up
  useEffect(() => {
    if (codeRef.current && isGenerating && shouldAutoScroll) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight
    }
  }, [parsedContent, isGenerating, shouldAutoScroll])

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

      <div className="relative w-full h-full overflow-auto p-4" ref={codeRef} onScroll={handleScroll}>
        <button
          onClick={copyToClipboard}
          className="absolute top-4 right-4 p-2 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 transition-colors z-20"
          aria-label="Copy code"
          disabled={!code || isGenerating}
        >
          {copied ? <Check className="h-5 w-5" /> : <Clipboard className="h-5 w-5" />}
        </button>

        {code || isGenerating ? (
          <div className="prose prose-invert max-w-none">{parsedContent}</div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No content generated yet. Start a conversation to generate content.
          </div>
        )}
      </div>
    </div>
  )
}

