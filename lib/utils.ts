import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse URL hash parameters into an object
 * @param hash - The URL hash string (including the # character)
 * @returns An object containing the parsed parameters
 */
export function parseHashParams(hash: string): Record<string, string> {
  if (!hash || hash === "#") return {}

  // Remove the leading # character
  const hashContent = hash.substring(1)

  // Split by & and create an object of key-value pairs
  return hashContent.split("&").reduce((result: Record<string, string>, item: string) => {
    const [key, value] = item.split("=")
    if (key && value) {
      result[key] = decodeURIComponent(value)
    }
    return result
  }, {})
}
