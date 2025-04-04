"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Clipboard, Check, Loader2, FileCode, Edit, Replace, AlertTriangle } from "lucide-react"

// Include Prism.js directly to avoid import issues
const Prism = {
  languages: {
    javascript: {
      comment: [
        { pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/, lookbehind: true, greedy: true },
        { pattern: /(^|[^\\:])\/\/.*/, lookbehind: true, greedy: true },
      ],
      string: {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true,
      },
      keyword:
        /\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
      boolean: /\b(?:true|false)\b/,
      number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
      operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
      punctuation: /[{}[\];(),.:]/,
    },
    typescript: {
      comment: [
        { pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/, lookbehind: true, greedy: true },
        { pattern: /(^|[^\\:])\/\/.*/, lookbehind: true, greedy: true },
      ],
      string: {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true,
      },
      keyword:
        /\b(?:abstract|as|async|await|break|case|catch|class|const|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|is|keyof|let|module|namespace|new|null|of|package|private|protected|public|readonly|return|require|set|static|super|switch|this|throw|try|type|typeof|undefined|var|void|while|with|yield)\b/,
      boolean: /\b(?:true|false)\b/,
      number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
      operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
      punctuation: /[{}[\];(),.:]/,
    },
    jsx: {
      comment: [
        { pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/, lookbehind: true, greedy: true },
        { pattern: /(^|[^\\:])\/\/.*/, lookbehind: true, greedy: true },
      ],
      string: {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true,
      },
      keyword:
        /\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
      boolean: /\b(?:true|false)\b/,
      number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
      operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
      punctuation: /[{}[\];(),.:]/,
      tag: {
        pattern:
          /<\/?(?:[\w.:-]+\s*(?:\s+(?:[\w.:$-]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s{'">=]+|\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])+\}))?|\{\.{3}[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\}))*\s*\/?)?>/i,
        greedy: true,
        inside: {
          tag: {
            pattern: /^<\/?[^\s>/]+/i,
            inside: {
              punctuation: /^<\/?/,
              namespace: /^[^\s>/:]+:/,
            },
          },
          "attr-value": {
            pattern: /=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">]+)/i,
            inside: {
              punctuation: [
                /^=/,
                {
                  pattern: /(^|[^\\])["']/,
                  lookbehind: true,
                },
              ],
            },
          },
          punctuation: /\/?>/,
          "attr-name": {
            pattern: /[^\s>/]+/,
            inside: {
              namespace: /^[^\s>/:]+:/,
            },
          },
        },
      },
    },
    html: {
      comment: /<!--[\s\S]*?-->/,
      prolog: /<\?[\s\S]+?\?>/,
      doctype: {
        pattern:
          /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
        greedy: true,
      },
      tag: {
        pattern:
          /<\/?(?!\d)[^\s>/=$<%]+(?:\s(?:\s*[^\s>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/i,
        greedy: true,
        inside: {
          tag: {
            pattern: /^<\/?[^\s>/]+/i,
            inside: {
              punctuation: /^<\/?/,
              namespace: /^[^\s>/:]+:/,
            },
          },
          "attr-value": {
            pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/i,
            inside: {
              punctuation: [
                /^=/,
                {
                  pattern: /^(\s*)["']|["']$/,
                  lookbehind: true,
                },
              ],
            },
          },
          punctuation: /\/?>/,
          "attr-name": {
            pattern: /[^\s>/]+/,
            inside: {
              namespace: /^[^\s>/:]+:/,
            },
          },
        },
      },
      entity: /&#?[\da-z]{1,8};/i,
    },
    css: {
      comment: /\/\*[\s\S]*?\*\//,
      atrule: {
        pattern: /@[\w-](?:[^;{\s]|\s+(?![\s{]))*(?:;|(?=\s*\{))/,
        inside: {
          rule: /^@[\w-]+/,
          "selector-function-argument": {
            pattern: /(\bselector\s*$$\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|$$(?:[^()]|$$[^()]*$$)*$$)+(?=\s*$$)/,
            lookbehind: true,
            alias: "selector",
          },
        },
      },
      url: {
        pattern: RegExp(
          "\\burl$$(?:" +
            /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/.source +
            "|" +
            /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*'/.source +
            "|" +
            /(?:[^\s()"']|\\[\s\S])*/.source +
            ")$$",
          "i",
        ),
        greedy: true,
        inside: {
          function: /^url/i,
          punctuation: /^$$|$$$/,
          string: {
            pattern: RegExp(
              "^" +
                /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/.source +
                "$|^" +
                /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*'/.source +
                "$",
            ),
            greedy: true,
          },
        },
      },
      selector: RegExp(
        "[^{}\\s](?:[^{};\"'\\s]|\\s+(?![\\s{])|" +
          /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/.source +
          "|" +
          /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*'/.source +
          ")*(?=\\s*\\{)",
      ),
      string: {
        pattern: /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*'/,
        greedy: true,
      },
      property: /(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
      important: /!important\b/i,
      function: /[-a-z0-9]+(?=\()/i,
      punctuation: /[(){};:,]/,
    },
    json: {
      property: {
        pattern: /"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
        greedy: true,
      },
      string: {
        pattern: /"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
        greedy: true,
      },
      comment: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
      number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
      punctuation: /[{}[\],]/,
      operator: /:/,
      boolean: /\b(?:true|false)\b/,
      null: {
        pattern: /\bnull\b/,
        alias: "keyword",
      },
    },
  },
  highlight: (text, grammar, language) => {
    if (!grammar) return text

    const tokens = tokenize(text, grammar)
    return tokens
      .map((token) => {
        if (typeof token === "string") {
          return token
        } else {
          let className = "token " + token.type
          if (token.alias) {
            className += " " + (Array.isArray(token.alias) ? token.alias.join(" ") : token.alias)
          }
          return `<span class="${className}">${token.content}</span>`
        }
      })
      .join("")
  },
}

// Simple tokenizer function
function tokenize(text, grammar) {
  const tokens = []
  let rest = text

  for (const tokenType in grammar) {
    if (!grammar.hasOwnProperty(tokenType) || tokenType === "rest") continue

    const pattern = typeof grammar[tokenType] === "object" ? grammar[tokenType].pattern : grammar[tokenType]

    if (!pattern) continue

    // Convert pattern to RegExp if it's not already
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern)

    let match
    while (rest.length > 0 && (match = regex.exec(rest)) !== null) {
      const matchedText = match[0]
      const index = match.index

      // Add the text before the match
      if (index > 0) {
        tokens.push(rest.substring(0, index))
      }

      // Add the matched token
      tokens.push({
        type: tokenType,
        content: matchedText,
      })

      // Update the rest of the text
      rest = rest.substring(index + matchedText.length)
    }
  }

  // Add any remaining text
  if (rest.length > 0) {
    tokens.push(rest)
  }

  return tokens
}

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

// Determine file type for syntax highlighting
const getFileType = (fileName?: string) => {
  if (!fileName) return "text"

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

// Detect file type from content if filename is not available
const detectFileTypeFromContent = (content: string): string => {
  if (!content) return "text"

  // Check for HTML
  if (content.includes("<!DOCTYPE html>") || (content.includes("<html") && content.includes("<body"))) {
    return "html"
  }

  // Check for JSX/TSX
  if (
    (content.includes("import React") || content.includes('from "react"')) &&
    (content.includes("function") || content.includes("const") || content.includes("class")) &&
    content.includes("return (") &&
    (content.includes("<div") || content.includes("<>"))
  ) {
    return "jsx"
  }

  // Check for JavaScript/TypeScript
  if (
    content.includes("function") ||
    content.includes("const ") ||
    content.includes("let ") ||
    content.includes("var ") ||
    content.includes("import ") ||
    content.includes("export ")
  ) {
    return content.includes(": ") || content.includes("interface ") || content.includes("type ")
      ? "typescript"
      : "javascript"
  }

  // Check for CSS
  if (
    content.includes("{") &&
    content.includes("}") &&
    (content.includes("margin:") || content.includes("padding:") || content.includes("color:"))
  ) {
    return "css"
  }

  // Check for JSON
  if (
    (content.trim().startsWith("{") && content.trim().endsWith("}")) ||
    (content.trim().startsWith("[") && content.trim().endsWith("]"))
  ) {
    try {
      JSON.parse(content)
      return "json"
    } catch (e) {
      // Not valid JSON
    }
  }

  // Default
  return "javascript"
}

// Enhanced syntax highlighting function using our embedded Prism
const highlightCode = (code: string, language: string): string => {
  if (!code) return ""

  // Escape HTML to prevent XSS
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

  // Get the grammar for the language
  const grammar = Prism.languages[language] || Prism.languages.javascript

  // Highlight the code
  const highlighted = Prism.highlight(escaped, grammar, language)

  // Add line numbers
  const lines = highlighted.split("\n")
  const lineNumbers = lines
    .map((_, i) => `<span class="text-gray-500 select-none mr-4 inline-block w-5 text-right">${i + 1}</span>`)
    .join("\n")

  // Add line numbers
  const codeWithLineNumbers = lines
    .map((line, i) => `<div class="code-line">${lineNumbers.split("\n")[i]}${line || " "}</div>`)
    .join("")

  return `<div class="code-block">${codeWithLineNumbers}</div>`
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
  // Determine file type for syntax highlighting
  const fileType = fileName ? getFileType(fileName) : content ? detectFileTypeFromContent(content) : "javascript"

  // For find/replace, try to detect the file type from content
  const findReplaceFileType = findContent
    ? detectFileTypeFromContent(findContent)
    : replaceContent
      ? detectFileTypeFromContent(replaceContent)
      : "javascript"

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

  // Render header
  const renderHeader = () => (
    <div className="flex items-center gap-2 p-3 border-b border-purple-900/20 bg-[#1A1825]">
      {type === "create_file" && <FileCode className="h-4 w-4 text-green-400" />}
      {type === "edit_file" && <Edit className="h-4 w-4 text-blue-400" />}
      {type === "content_replace" && <Replace className="h-4 w-4 text-yellow-400" />}

      <span className="font-mono text-sm text-gray-200">{fileName}</span>

      <span className="ml-auto text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-300">
        {type === "create_file" ? "Created" : type === "edit_file" ? "Edited" : "Modified"}
      </span>
    </div>
  )

  // Render content with syntax highlighting
  const renderContent = (content: string, language: string) => {
    return (
      <div
        className="p-4 text-sm font-mono whitespace-pre-wrap text-gray-300 overflow-auto bg-[#1E1A29]"
        dangerouslySetInnerHTML={{ __html: highlightCode(content, language) }}
      />
    )
  }

  return (
    <div className="my-2 bg-[#13111C] rounded-lg border border-purple-900/20 overflow-hidden">
      {renderHeader()}

      {type === "content_replace" ? (
        <div>
          {findContent && (
            <div className="border-b border-purple-900/20">
              <div className="px-3 py-1 text-xs text-red-300 bg-red-900/10 border-l-2 border-red-500">Find</div>
              {renderContent(findContent, findReplaceFileType)}
            </div>
          )}
          {replaceContent && (
            <div>
              <div className="px-3 py-1 text-xs text-green-300 bg-green-900/10 border-l-2 border-green-500">
                Replace
              </div>
              {renderContent(replaceContent, findReplaceFileType)}
            </div>
          )}
        </div>
      ) : (
        renderContent(content || "", fileType)
      )}
    </div>
  )
}

// Function to extract file actions from loaded logs
const extractFileActionsFromLogs = (logs: string): React.ReactNode[] => {
  if (!logs) return []

  const result: React.ReactNode[] = []
  const fileActionRegex = /<webgen_action\s+type="([^"]+)"\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/webgen_action>/g

  let match
  let lastIndex = 0

  while ((match = fileActionRegex.exec(logs)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textBefore = logs.substring(lastIndex, match.index)
      if (textBefore.trim()) {
        const detectedType = detectFileTypeFromContent(textBefore)
        result.push(
          <div
            key={`text-${result.length}`}
            className="font-mono text-sm text-gray-300 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: convertAnsiToHtml(textBefore),
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

  // Add any remaining text
  if (lastIndex < logs.length) {
    const remainingText = logs.substring(lastIndex)
    if (remainingText.trim()) {
      result.push(
        <div
          key={`text-${result.length}`}
          className="font-mono text-sm text-gray-300 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{
            __html: convertAnsiToHtml(remainingText),
          }}
        />,
      )
    }
  }

  return result
}

export default function CodeView({ code, isGenerating = false }: CodeViewProps) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const [userScrolled, setUserScrolled] = useState(false)
  const [previousCode, setPreviousCode] = useState("")
  const [parsedContent, setParsedContent] = useState<React.ReactNode[]>([])
  const [textContent, setTextContent] = useState("")
  const [isLoadedLog, setIsLoadedLog] = useState(false)

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

  // Detect if this is a loaded log rather than a live generation
  useEffect(() => {
    if (code && !isGenerating && !previousCode) {
      setIsLoadedLog(true)
    }
  }, [code, isGenerating, previousCode])

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

    // For loaded logs, use a different parsing approach
    if (isLoadedLog) {
      const extractedContent = extractFileActionsFromLogs(code)
      setParsedContent(extractedContent)
      setPreviousCode(code)
      return
    }

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
              dangerouslySetInnerHTML={{
                __html: convertAnsiToHtml(currentText),
              }}
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
      // For plain text, try to detect the language
      const detectedType = detectFileTypeFromContent(currentText)

      // Use our custom syntax highlighting
      result.push(
        <div
          key={`text-${result.length}`}
          className="my-2 bg-[#1E1A29] p-4 rounded-lg overflow-auto"
          dangerouslySetInnerHTML={{
            __html: highlightCode(currentText, detectedType),
          }}
        />,
      )
    }

    setTextContent(currentText)
    setParsedContent(result)
    setPreviousCode(code)
  }, [code, previousCode, isLoadedLog])

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
          <div className="prose prose-invert max-w-none">
            <style jsx global>{`
              .code-block {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                font-size: 0.875rem;
                line-height: 1.5;
              }
              .code-line {
                display: flex;
                white-space: pre;
              }
              .code-line:hover {
                background-color: rgba(99, 102, 241, 0.1);
              }
              /* Prism-inspired token colors */
              .token.comment { color: #6a9955; }
              .token.string { color: #ce9178; }
              .token.keyword { color: #c586c0; }
              .token.boolean { color: #569cd6; }
              .token.number { color: #b5cea8; }
              .token.operator { color: #d4d4d4; }
              .token.punctuation { color: #d4d4d4; }
              .token.property { color: #9cdcfe; }
              .token.tag { color: #569cd6; }
              .token.attr-name { color: #9cdcfe; }
              .token.attr-value { color: #ce9178; }
              .token.function { color: #dcdcaa; }
            `}</style>
            {parsedContent}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No content generated yet. Start a conversation to generate content.
          </div>
        )}
      </div>
    </div>
  )
}

