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
  Lock,
  MapPin,
  CreditCard,
  UserPlus,
  Calendar,
  Clock,
  ChevronRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { checkWhiteLabelAccess } from "@/services/white-label"
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown"
import { ProfileDropdown } from "@/components/profile/profile-dropdown"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useTheme } from "@/contexts/theme-context"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [hasWhiteLabelAccess, setHasWhiteLabelAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { theme } = useTheme()
  
  useEffect(() => {
    async function checkAccess() {
      try {
        console.log("DashboardLayout - Current pathname:", pathname);
        
        // Only check white label access if we're on a relevant page
        if (pathname === "/dashboard/white-label" || pathname.startsWith("/dashboard/white")) {
          console.log("DashboardLayout - On white label page, checking access");
          const hasAccess = await checkWhiteLabelAccess();
          console.log("DashboardLayout - White label access result:", hasAccess);
          setHasWhiteLabelAccess(hasAccess);
        }
      } catch (error) {
        console.error("Error checking white label access:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAccess()
  }, [pathname])
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }
  
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }
  
  const toggleSubMenu = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName) 
        : [...prev, itemName]
    )
  }
  
  const navigation = [
    // Core features
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Projects", href: "/projects", icon: FileText },
    
    // SEO features
    { name: "SEO Audits", href: "/audits", icon: Search },
    { name: "Competitors", href: "/competitors", icon: Users },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    
    // Task management
    { name: "Tasks & Todos", href: "/todos", icon: CheckSquare,
      subItems: [
        { name: "Kanban Board", href: "/todos?view=kanban", icon: CheckSquare },
        { name: "Calendar", href: "/todos?view=calendar", icon: Calendar },
        { name: "Time Tracking", href: "/todos?view=time", icon: Clock },
        { name: "Metrics", href: "/todos?view=metrics", icon: BarChart3 }
      ]
    },
    
    // Team features
    { name: "Team Management", href: "/team", icon: UserPlus, proAndAbove: true,
      subItems: [
        { name: "Team Members", href: "/team", icon: UserPlus },
        { name: "Task Assignments", href: "/team/assignments", icon: CheckSquare },
      ]
    },
    
    // Lead generation
    { name: "Lead Finder", href: "/lead-finder", icon: MapPin, enterpriseOnly: true },
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
          {/* Sidebar header with theme-aware logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b">
            <Link href="/dashboard" className="flex items-center">
              <img 
                src={theme === "dark" ? "/Logos/LilySEO_logo_knockout.png" : "/Logos/LilySEO_logo_mark.png"} 
                alt="LilySEO Logo" 
                className="h-12 w-auto" 
              />
            </Link>
          </div>
          
          {/* Sidebar navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.subItems 
                ? pathname === item.href || pathname.startsWith(`${item.href}/`) || item.subItems.some(subItem => 
                    pathname === subItem.href || pathname.startsWith(`${subItem.href}/`) || 
                    (pathname.includes('?') && pathname.split('?')[0] === item.href.split('?')[0] && pathname.includes(subItem.href.split('?')[1]))
                  )
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              
              const isExpanded = expandedItems.includes(item.name);
              
              return (
                <div key={item.name} className="space-y-1">
                  {item.subItems ? (
                    <button
                      onClick={() => toggleSubMenu(item.name)}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm rounded-md ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                        {!isLoading && item.enterpriseOnly && (
                          <Lock className="ml-2 h-4 w-4 text-muted-foreground" />
                        )}
                        {!isLoading && item.proAndAbove && (
                          <Lock className="ml-2 h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-2 text-sm rounded-md ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                      {!isLoading && item.enterpriseOnly && (
                        <Lock className="ml-2 h-4 w-4 text-muted-foreground" />
                      )}
                      {!isLoading && item.proAndAbove && (
                        <Lock className="ml-2 h-4 w-4 text-muted-foreground" />
                      )}
                    </Link>
                  )}
                  
                  {/* Render submenu items if expanded */}
                  {item.subItems && isExpanded && (
                    <div className="pl-10 space-y-1">
                      {item.subItems.map(subItem => {
                        const isSubActive = pathname === subItem.href || 
                          pathname.startsWith(`${subItem.href}/`) || 
                          (pathname.includes('?') && pathname.split('?')[0] === item.href.split('?')[0] && pathname.includes(subItem.href.split('?')[1]));
                        
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`flex items-center px-2 py-1.5 text-sm rounded-md ${
                              isSubActive
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            <subItem.icon className="mr-2 h-4 w-4" />
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          
          {/* Sidebar footer */}
          <div className="p-4 border-t">
            <div className="space-y-2">
              <Link
                href="/dashboard/white-label?debug=true"
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  pathname === "/dashboard/white-label"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                }`}
                onClick={(e) => {
                  // Prevent default behavior
                  e.preventDefault();
                  
                  // Use router.push to navigate and ensure we get a full page reload
                  const url = '/dashboard/white-label?debug=true';
                  window.location.href = url; // Force full page reload
                }}
              >
                <Palette className="mr-3 h-5 w-5" />
                White Label
                {!isLoading && !hasWhiteLabelAccess && (
                  <Lock className="ml-2 h-4 w-4 text-muted-foreground" />
                )}
              </Link>
              <Link
                href="/dashboard/settings"
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  pathname === "/dashboard/settings"
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
            <ThemeToggle />
            <NotificationsDropdown />
            <ProfileDropdown />
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
} 