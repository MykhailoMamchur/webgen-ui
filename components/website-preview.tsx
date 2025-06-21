"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { trpc } from "@/trpc/client"
import { useState } from "react"
import { ExternalLink, RefreshCw, X } from "lucide-react"

interface WebsitePreviewProps {
  websiteId: string
}

export function WebsitePreview({ websiteId }: WebsitePreviewProps) {
  const [showStartupDialog, setShowStartupDialog] = useState(true)
  const { toast } = useToast()

  const { data: website, isLoading } = trpc.website.getWebsite.useQuery({
    websiteId,
  })

  const { mutate: deployWebsite, isLoading: isDeploying } = trpc.website.deployWebsite.useMutation({
    onSuccess: () => {
      toast({
        title: "Website deployed!",
        description: "Your website is now live.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error deploying website",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-60" />
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center">
            <Skeleton className="h-9 w-96" />
          </div>
          <div className="flex items-center">
            <Skeleton className="h-9 w-96" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[100px]" />
        </CardFooter>
      </Card>
    )
  }

  if (!website) {
    return <div>Website not found</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{website.name}</CardTitle>
        <CardDescription>Here&apos;s a preview of your website.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center">
          <Label htmlFor="url">URL</Label>
          <Input id="url" defaultValue={website.url} className="ml-2 w-full" readOnly />
          <Button size="sm" variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Visit
          </Button>
        </div>
        <div className="flex items-center">
          <Label htmlFor="status">Status</Label>
          <Badge variant="secondary" className={cn("ml-2 w-fit", website.isOnline ? "bg-green-500" : "bg-red-500")}>
            {website.isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button disabled={isDeploying} onClick={() => deployWebsite({ websiteId: website.id })}>
          {isDeploying ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : (
            "Deploy"
          )}
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">View startup guide</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Starting up your project...</DialogTitle>
              <button
                onClick={() => setShowStartupDialog(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </DialogHeader>
            <DialogDescription>Here are some tips to get you started with your new website.</DialogDescription>
            <ol className="list-decimal pl-6">
              <li>Make sure you have a domain name and that it is pointing to our servers.</li>
              <li>Check your DNS settings to ensure that your domain name is properly configured.</li>
              <li>If you are using a custom domain, make sure that you have configured your SSL certificate.</li>
            </ol>
          </DialogContent>
        </Dialog>
      </CardFooter>
      <Dialog
        open={showStartupDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowStartupDialog(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Starting up your project...</DialogTitle>
            <button
              onClick={() => setShowStartupDialog(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogHeader>
          <DialogDescription>Here are some tips to get you started with your new website.</DialogDescription>
          <ol className="list-decimal pl-6">
            <li>Make sure you have a domain name and that it is pointing to our servers.</li>
            <li>Check your DNS settings to ensure that your domain name is properly configured.</li>
            <li>If you are using a custom domain, make sure that you have configured your SSL certificate.</li>
          </ol>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
