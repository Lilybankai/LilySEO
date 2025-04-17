"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function AccountSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  // User profile state
  const [userId, setUserId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState(""); // Note: Supabase doesn't require current password for update via JS client SDK
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/auth/login");
          return;
        }
        
        setUserId(user.id);
        setEmail(user.email || "");
        
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // Ignore 'PGRST116' (No rows found)
            console.error("Error fetching profile:", error);
            toast.error("Failed to load profile data");
            return;
        }
        
        if (profile) {
          setFirstName(profile.first_name || "");
          setLastName(profile.last_name || "");
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [router]);

  // Handle profile update (Name)
  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);
      
      if (error) {
        throw error;
      }
      
      toast.success("Profile updated successfully");
      
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle password update
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) { // Basic check, consider more robust validation
        toast.error("Password must be at least 6 characters long");
        return;
    }

    try {
      setSavingPassword(true);
      const supabase = createClient();
      
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        console.error("Error updating password:", error);
        toast.error(error.message || "Failed to update password");
        return;
      }
      
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
      
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("An unexpected error occurred while updating password");
    } finally {
      setSavingPassword(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your name and view your email address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input 
                id="first-name" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                disabled={savingProfile}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input 
                id="last-name" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Your last name"
                disabled={savingProfile}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              value={email} 
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Your email address cannot be changed here.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSaveProfile} 
            disabled={savingProfile}
            className="ml-auto"
          >
            {savingProfile ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Name"
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Note: Supabase client SDK updateUser doesn't require current password */}
          {/* Consider adding server-side validation if current password check is needed */}
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input 
              id="new-password" 
              type="password"
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min. 6 characters)"
              disabled={savingPassword}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input 
              id="confirm-password" 
              type="password"
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={savingPassword}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handlePasswordChange} 
            disabled={savingPassword}
            className="ml-auto"
          >
            {savingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 