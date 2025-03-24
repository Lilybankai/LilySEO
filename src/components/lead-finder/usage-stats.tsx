"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { BarChart, Calendar, Package, Shield } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getSearchPackages, purchaseSearchPackage } from "@/services/lead-finder"
import type { SearchPackage } from "@/services/lead-finder"
import AddCredits from "./add-credits"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UsageStatsProps {
  onPackagePurchased: (searches: number) => void
}

export default function UsageStats({ onPackagePurchased }: UsageStatsProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [packages, setPackages] = useState<SearchPackage[]>([])
  const [userId, setUserId] = useState<string>("")
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [stats, setStats] = useState<{
    remaining_searches: number
    monthly_limit: number
    used_searches: number
    search_history: any[]
    purchased_packages: any[]
  }>({
    remaining_searches: 0,
    monthly_limit: 250,
    used_searches: 0,
    search_history: [],
    purchased_packages: []
  })
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch usage stats
        const response = await fetch("/api/lead-finder/usage")
        const data = await response.json()
        
        if (response.ok) {
          setStats(data)
          setUserId(data.user_id || "")
          // For demo purposes, consider all enterprise users as admin
          // In production, you would check a specific admin role
          setIsAdmin(true)
        }
        
        // Fetch available packages
        const packagesResponse = await fetch("/api/lead-finder/packages")
        const packagesData = await packagesResponse.json()
        
        if (packagesResponse.ok) {
          setPackages(packagesData.packages || [])
        }
      } catch (error) {
        console.error("Error fetching usage data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  const handlePurchasePackage = async (packageId: string, searchCount: number) => {
    try {
      const response = await fetch("/api/lead-finder/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ packageId })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to purchase package")
      }
      
      toast({
        title: "Package purchased",
        description: `You've successfully purchased a package with ${searchCount} searches.`
      })
      
      // Update the stats
      onPackagePurchased(searchCount)
      
      // Refresh data
      const statsResponse = await fetch("/api/lead-finder/usage")
      const statsData = await statsResponse.json()
      
      if (statsResponse.ok) {
        setStats(statsData)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error purchasing package",
        description: error.message || "There was an error purchasing the package."
      })
    }
  }

  const handleCreditsAdded = (credits: number) => {
    // Update the stats
    onPackagePurchased(credits)
    
    // Refresh data
    fetchData()
  }

  const fetchData = async () => {
    try {
      // Fetch usage stats
      const response = await fetch("/api/lead-finder/usage")
      const data = await response.json()
      
      if (response.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error("Error refreshing usage data:", error)
    }
  }
  
  if (isLoading) {
    return <div className="py-10 text-center">Loading usage stats...</div>
  }
  
  const usagePercentage = (() => {
    const used = typeof stats.used_searches === 'object' ? 0 : stats.used_searches;
    const limit = typeof stats.monthly_limit === 'object' ? 250 : stats.monthly_limit;
    return limit > 0 ? Math.round((used / limit) * 100) : 0;
  })();
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {typeof stats.used_searches === 'object' ? 0 : stats.used_searches} / 
              {typeof stats.monthly_limit === 'object' ? 250 : stats.monthly_limit}
            </div>
            <p className="text-xs text-muted-foreground">searches used this month</p>
            <Progress 
              value={usagePercentage} 
              className="h-2 mt-3" 
            />
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">
              Searches reset at the beginning of each month
            </p>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Remaining Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {typeof stats.remaining_searches === 'object' ? 0 : stats.remaining_searches}
            </div>
            <p className="text-xs text-muted-foreground">searches available</p>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">
              Including your additional purchased packages
            </p>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Purchase More</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Package className="mr-2 h-4 w-4" />
                  Buy Search Package
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Purchase Search Package</DialogTitle>
                  <DialogDescription>
                    Select a package to increase your available searches
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="packages">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="packages">Standard Packages</TabsTrigger>
                    {isAdmin && (
                      <TabsTrigger value="admin" className="flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        Admin
                      </TabsTrigger>
                    )}
                  </TabsList>
                  
                  <TabsContent value="packages" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                      {packages.map((pkg) => (
                        <Card key={pkg.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{pkg.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="text-2xl font-bold">${pkg.price.toFixed(2)}</div>
                            <p className="text-sm text-muted-foreground">
                              {pkg.searches_count} Searches
                            </p>
                          </CardContent>
                          <CardFooter>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => handlePurchasePackage(pkg.id, pkg.searches_count)}
                            >
                              Purchase
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                  
                  {isAdmin && (
                    <TabsContent value="admin" className="pt-4">
                      <AddCredits 
                        userId={userId} 
                        onCreditsAdded={handleCreditsAdded} 
                      />
                    </TabsContent>
                  )}
                </Tabs>
                
                <DialogFooter>
                  <Button variant="outline" className="w-full">
                    Contact Sales for Custom Packages
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">
              Additional packages never expire
            </p>
          </CardFooter>
        </Card>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Search History
        </h3>
        
        {stats.search_history.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Search Query</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Results</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.search_history.slice(0, 10).map((search) => (
                  <TableRow key={search.id}>
                    <TableCell>
                      {new Date(search.search_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{search.search_query}</TableCell>
                    <TableCell>{search.location}</TableCell>
                    <TableCell className="text-right">{search.results_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border rounded-md py-8 text-center text-muted-foreground">
            You haven't performed any searches yet
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Purchased Packages
        </h3>
        
        {stats.purchased_packages.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead className="text-right">Remaining Searches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.purchased_packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      {new Date(pkg.purchase_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {pkg.search_packages.name} ({pkg.search_packages.searches_count} searches)
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {pkg.remaining_searches}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border rounded-md py-8 text-center text-muted-foreground">
            You haven't purchased any additional packages yet
          </div>
        )}
      </div>
    </div>
  )
} 