"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { 
  isProjectConnectedToGSC, 
  generateGSCAuthUrl, 
  disconnectFromGSC 
} from "@/services/google-search-console"

interface SearchConsoleButtonProps {
  projectId: string
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function SearchConsoleButton({
  projectId,
  variant = "default",
  size = "default",
  className = ""
}: SearchConsoleButtonProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check if the project is connected to GSC
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await isProjectConnectedToGSC(projectId)
      setIsConnected(connected)
    }
    
    checkConnection()
  }, [projectId])

  // Handle connecting to GSC
  const handleConnect = async () => {
    setIsLoading(true)
    try {
      const authUrl = await generateGSCAuthUrl(projectId)
      if (authUrl) {
        window.location.href = authUrl
      } else {
        console.error('Failed to generate GSC auth URL')
      }
    } catch (error) {
      console.error('Error connecting to GSC:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle disconnecting from GSC
  const handleDisconnect = async () => {
    setIsLoading(true)
    try {
      const success = await disconnectFromGSC(projectId)
      if (success) {
        setIsConnected(false)
      } else {
        console.error('Failed to disconnect from GSC')
      }
    } catch (error) {
      console.error('Error disconnecting from GSC:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // If we're still checking the connection status, show a loading state
  if (isConnected === null) {
    return (
      <Button
        variant="outline"
        size={size}
        className={`${className} opacity-50`}
        disabled
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking connection...
      </Button>
    )
  }

  // If the project is connected to GSC, show a disconnect button
  if (isConnected) {
    return (
      <Button
        variant="outline"
        size={size}
        className={className}
        onClick={handleDisconnect}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Disconnecting...
          </>
        ) : (
          <>
            <img 
              src="/images/google-search-console-logo.svg" 
              alt="Google Search Console" 
              className="mr-2 h-4 w-4" 
            />
            Disconnect from Search Console
          </>
        )}
      </Button>
    )
  }

  // If the project is not connected to GSC, show a connect button
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleConnect}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <img 
            src="/images/google-search-console-logo.svg" 
            alt="Google Search Console" 
            className="mr-2 h-4 w-4" 
          />
          Connect to Search Console
        </>
      )}
    </Button>
  )
} 