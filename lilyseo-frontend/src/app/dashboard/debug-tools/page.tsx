"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function DebugToolsPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [upgradeStatus, setUpgradeStatus] = useState<{success?: boolean; message?: string} | null>(null)

  // Fetch current user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/user/profile")
        const data = await response.json()
        
        if (response.ok) {
          setUserInfo(data)
        } else {
          console.error("Error fetching user info:", data)
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserInfo()
  }, [upgradeStatus])

  // Upgrade to enterprise tier
  const handleUpgradeToEnterprise = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/dev/set-enterprise")
      const data = await response.json()
      
      if (response.ok) {
        setUpgradeStatus({
          success: true,
          message: "Successfully upgraded to enterprise tier!"
        })
      } else {
        setUpgradeStatus({
          success: false,
          message: data.error || "Failed to upgrade to enterprise tier"
        })
        console.error("Error upgrading to enterprise:", data)
      }
    } catch (error) {
      setUpgradeStatus({
        success: false,
        message: "An unexpected error occurred"
      })
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debug Tools</h1>
          <p className="text-muted-foreground">
            Development tools to help with testing and debugging
          </p>
        </div>

        {process.env.NODE_ENV !== "development" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              These tools should only be used in development environments.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Current user details and subscription status</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-20 flex items-center justify-center">
                  <p>Loading user info...</p>
                </div>
              ) : userInfo ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Email:</p>
                    <p className="text-lg">{userInfo.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Subscription Tier:</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-semibold ${
                        userInfo.subscription_tier === "enterprise" 
                          ? "text-green-600" 
                          : "text-amber-600"
                      }`}>
                        {userInfo.subscription_tier}
                      </span>
                      {userInfo.subscription_tier === "enterprise" && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">User ID:</p>
                    <p className="text-xs text-muted-foreground break-all">{userInfo.id}</p>
                  </div>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center">
                  <p className="text-muted-foreground">User not logged in or error loading data</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {userInfo && userInfo.subscription_tier !== "enterprise" && (
                <Button 
                  onClick={handleUpgradeToEnterprise} 
                  disabled={isLoading}
                >
                  Upgrade to Enterprise
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Access</CardTitle>
              <CardDescription>Check access to specific features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    <span>Lead Finder</span>
                  </div>
                  <div className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    userInfo?.subscription_tier === "enterprise"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {userInfo?.subscription_tier === "enterprise" ? "Accessible" : "Not Accessible"}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2">
              {upgradeStatus && (
                <Alert variant={upgradeStatus.success ? "default" : "destructive"}>
                  {upgradeStatus.success 
                    ? <CheckCircle2 className="h-4 w-4" />
                    : <AlertCircle className="h-4 w-4" />
                  }
                  <AlertDescription>{upgradeStatus.message}</AlertDescription>
                </Alert>
              )}
              <div className="text-xs text-muted-foreground">
                <p>The Lead Finder feature is only available to enterprise users. Use the upgrade button to enable access.</p>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Debugging Links</CardTitle>
              <CardDescription>Quick access to important pages for testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/lead-finder">Lead Finder Page</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 