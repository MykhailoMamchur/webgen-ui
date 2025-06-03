"use client"

import { useState, useEffect } from "react"
import { X, Check, Globe, Zap, Shield, Search } from "lucide-react"

interface UpgradeSuccessBannerProps {
  onDismiss: () => void
}

export default function UpgradeSuccessBanner({ onDismiss }: UpgradeSuccessBannerProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Add a small delay for animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Wait for animation to complete
  }

  const features = [
    {
      icon: <Zap className="h-4 w-4" />,
      text: "100 edits per month",
    },
    {
      icon: <Globe className="h-4 w-4" />,
      text: "Connect your custom domains",
    },
    {
      icon: <Shield className="h-4 w-4" />,
      text: "Host up to 3 websites",
    },
    {
      icon: <Search className="h-4 w-4" />,
      text: "Built-in SEO optimization",
    },
    {
      icon: <Check className="h-4 w-4" />,
      text: "Private project support",
    },
  ]

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-900/95 to-green-900/95 backdrop-blur-sm border-b border-emerald-500/30 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <div>
                <h3 className="text-lg font-semibold text-white">Welcome to Pro! Your upgrade was successful</h3>
                <p className="text-sm text-emerald-100">You now have access to all premium features</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-emerald-200 hover:text-white transition-colors p-1"
            aria-label="Dismiss banner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-emerald-800/30 rounded-lg px-3 py-2 border border-emerald-600/20"
            >
              <div className="text-emerald-300">{feature.icon}</div>
              <span className="text-sm text-emerald-50 font-medium">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
