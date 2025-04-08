"use client"

import { useState } from "react"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface WelcomeScreenProps {
  onStart: (prompt: string) => void
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [prompt, setPrompt] = useState("")

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center z-[9999] welcome-grid">
      <div className="relative w-full max-w-3xl flex flex-col items-center text-center space-y-10 p-8">
        <div className="space-y-6">
          <div className="flex items-center justify-center mb-4 animate-glow">
            <Sparkles className="h-8 w-8 text-white mr-3 animate-pulse-slow" />
            <h1 className="text-3xl font-bold tracking-tight text-white">manufactura.ai</h1>
          </div>
          <h2 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-500">
            Tell us about your vision
          </h2>
          <p className="text-muted-foreground/80 text-lg max-w-xl mx-auto leading-relaxed">
            Describe your company and website needs in detail. Our AI will craft the perfect digital presence for your
            business.
          </p>
        </div>

        <div className="w-full space-y-6">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., I need a website for my artisanal coffee roastery. We focus on sustainable, single-origin beans and ship nationwide. Our brand colors are earthy tones with copper accents..."
            className="min-h-[200px] resize-none text-base p-6 bg-gray-200 dark:bg-gray-300 text-gray-900 border-purple-500/20 focus-visible:ring-purple-500/30 rounded-xl leading-relaxed placeholder:text-gray-600"
          />

          <Button
            onClick={() => onStart(prompt)}
            disabled={!prompt.trim()}
            size="lg"
            className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white font-medium px-10 py-7 h-auto transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-[1.02] rounded-xl relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center text-lg">
              Manufacture!
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground/60 max-w-lg">
          By clicking "Manufacture!" you agree to our terms of service and privacy policy. Your input will be used to
          generate website content tailored to your needs.
        </p>
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.2); }
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }

        .welcome-grid {
          background: radial-gradient(circle at center, #13111C 0%, #0A090F 100%);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }
        
        .welcome-grid::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -50%;
          bottom: -50%;
          left: -50%;
          background: 
            radial-gradient(circle at 20% 20%, rgba(168, 85, 247, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.05) 0%, transparent 60%);
          z-index: -1;
          transform: rotate(-12deg);
          animation: subtle-shift 20s ease-in-out infinite alternate;
          filter: blur(10px);
        }
        
        @keyframes subtle-shift {
          0% {
            transform: rotate(-12deg) translate(0, 0);
          }
          100% {
            transform: rotate(-8deg) translate(2%, 2%);
          }
        }
        
        .welcome-grid::after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%);
          z-index: -1;
        }
        
        .welcome-overlay-exit {
          opacity: 1;
          transition: opacity 0.3s ease-out;
        }
        
        .welcome-overlay-exit-active {
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
