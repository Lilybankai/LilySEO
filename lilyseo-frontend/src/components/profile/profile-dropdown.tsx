"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, 
  Settings, 
  LogOut, 
  HelpCircle, 
  FileText, 
  ThumbsUp,
  CreditCard,
  Key
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

// Create a real-time listener for profile updates
let profileChannel: any = null;

export function ProfileDropdown() {
  const router = useRouter();
  const [userInitials, setUserInitials] = useState("JD");
  const [userFullName, setUserFullName] = useState("John Doe");
  const [userEmail, setUserEmail] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [userTier, setUserTier] = useState("free");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        // Set user ID
        setUserId(user.id);
        
        // Set email
        setUserEmail(user.email || "");
        
        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          // Set full name
          const fullName = [profile.first_name, profile.last_name]
            .filter(Boolean)
            .join(" ");
          
          setUserFullName(fullName || "User");
          
          // Set profile image if available
          if (profile.avatar_url) {
            setProfileImage(profile.avatar_url);
          }
          
          // Set user tier
          if (profile.subscription_tier) {
            setUserTier(profile.subscription_tier.toLowerCase());
          }
          
          // Generate initials from name
          const initials = [profile.first_name, profile.last_name]
            .filter(Boolean)
            .map(name => name?.charAt(0).toUpperCase())
            .join("");
          
          setUserInitials(initials || "U");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();

    // Clean up previous listeners
    return () => {
      if (profileChannel) {
        profileChannel.unsubscribe();
      }
    };
  }, []);

  // Set up real-time listener for profile updates
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    
    // Set up real-time updates for profile changes
    profileChannel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          // Update profile data when changes are detected
          const newProfileData = payload.new;
          
          // Update avatar if changed
          if (newProfileData.avatar_url) {
            setProfileImage(newProfileData.avatar_url);
          }
          
          // Update name if changed
          const fullName = [newProfileData.first_name, newProfileData.last_name]
            .filter(Boolean)
            .join(" ");
          
          setUserFullName(fullName || "User");
          
          // Update initials if name changed
          const initials = [newProfileData.first_name, newProfileData.last_name]
            .filter(Boolean)
            .map(name => name?.charAt(0).toUpperCase())
            .join("");
          
          setUserInitials(initials || "U");
        }
      )
      .subscribe();

    return () => {
      profileChannel.unsubscribe();
    };
  }, [userId]);

  // Handle sign out
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer">
          {profileImage ? (
            <AvatarImage src={profileImage} alt={userFullName} />
          ) : (
            <AvatarFallback>{userInitials}</AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userFullName}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
            <div className="pt-1">
              <Badge variant={userTier === "free" ? "outline" : "default"} className="text-xs">
                {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Plan
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="cursor-pointer w-full">
            <User className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/dashboard/support" className="cursor-pointer w-full">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Support</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/dashboard/changelog" className="cursor-pointer w-full">
            <FileText className="mr-2 h-4 w-4" />
            <span>Change Log</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/dashboard/changelog?tab=features" className="cursor-pointer w-full">
            <ThumbsUp className="mr-2 h-4 w-4" />
            <span>Request a Feature</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/dashboard/subscription" className="cursor-pointer w-full">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Subscription</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild disabled={userTier === "free"}>
          <Link 
            href={userTier === "free" ? "#" : "/dashboard/api-access"} 
            className={`cursor-pointer w-full ${userTier === "free" ? "opacity-50 pointer-events-none" : ""}`}
          >
            <Key className="mr-2 h-4 w-4" />
            <span>API Access</span>
            {userTier === "free" && (
              <Badge variant="outline" className="ml-auto text-xs">Pro+</Badge>
            )}
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 