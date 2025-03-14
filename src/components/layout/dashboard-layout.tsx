"use client"

import { ReactNode, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  Search, 
  FileText, 
  Users, 
  Bell, 
  CheckSquare,
  Palette,
  Lock
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { checkWhiteLabelAccess } from "@/services/white-label"
import { Toaster } from "@/components/ui/toaster"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [hasWhiteLabelAccess, setHasWhiteLabelAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function checkAccess() {
      try {
        const hasAccess = await checkWhiteLabelAccess()
        setHasWhiteLabelAccess(hasAccess)
      } catch (error) {
        console.error("Error checking white label access:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAccess()
  }, [])
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }
  
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }
  
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Projects", href: "/projects", icon: FileText },
    { name: "SEO Audits", href: "/audits", icon: Search },
    { name: "Competitors", href: "/competitors", icon: Users },
    { name: "To-dos", href: "/todos", icon: CheckSquare },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ]
  
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-center h-16 px-4 border-b">
            <Link href="/dashboard" className="text-2xl font-bold">
              LilySEO
            </Link>
          </div>
          
          {/* Sidebar navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm rounded-md ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          
          {/* Sidebar footer */}
          <div className="p-4 border-t">
            <div className="space-y-2">
              <Link
                href="/dashboard/white-label"
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  pathname === "/dashboard/white-label"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Palette className="mr-3 h-5 w-5" />
                White Label
                {!isLoading && !hasWhiteLabelAccess && (
                  <Lock className="ml-2 h-4 w-4 text-muted-foreground" />
                )}
              </Link>
              <Link
                href="/settings"
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  pathname === "/settings"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={handleSignOut}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className={`lg:pl-64 min-h-screen flex flex-col`}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b bg-card">
          <div className="flex-1 lg:flex-none"></div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive"></span>
            </Button>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium">JD</span>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
        
        {/* Toast notifications */}
        <Toaster />
      </div>
    </div>
  )
} 