"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // User profile state
  const [userId, setUserId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userInitials, setUserInitials] = useState("");
  
  // Load user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/auth/login");
          return;
        }
        
        setUserId(user.id);
        setEmail(user.email || "");
        
        // Get user profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (error) {
          console.error("Error fetching profile:", error);
          toast.error("Failed to load profile data");
          return;
        }
        
        if (profile) {
          setFirstName(profile.first_name || "");
          setLastName(profile.last_name || "");
          setCompany(profile.company || "");
          setJobTitle(profile.job_title || "");
          setWebsite(profile.website || "");
          setAvatarUrl(profile.avatar_url || "");
          
          // Generate initials from name
          const initials = [profile.first_name, profile.last_name]
            .filter(Boolean)
            .map(name => name?.charAt(0).toUpperCase())
            .join("");
          
          setUserInitials(initials || "U");
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
  
  // Handle profile image upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      
      // Validate file type
      const fileType = file.type;
      if (!fileType.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be less than 2MB");
        return;
      }
      
      setUploadingAvatar(true);
      
      const supabase = createClient();
      
      // Get user session to ensure authenticated uploads
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in to upload an image");
        setUploadingAvatar(false);
        return;
      }
      
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/avatars/${fileName}`;
      
      // Now try to upload
      const { error: uploadError } = await supabase.storage
        .from("useruploads")
        .upload(filePath, file, {
          upsert: true,
          cacheControl: "3600"
        });
      
      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw uploadError;
      }
      
      // Get public URL
      const { data } = supabase.storage
        .from("useruploads")
        .getPublicUrl(filePath);
      
      const newAvatarUrl = data.publicUrl;
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl })
        .eq("id", userId);
      
      if (updateError) {
        throw updateError;
      }
      
      setAvatarUrl(newAvatarUrl);
      toast.success("Profile image updated successfully");
      
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  // Handle profile update
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const supabase = createClient();
      
      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          company,
          job_title: jobTitle,
          website,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);
      
      if (error) {
        throw error;
      }
      
      toast.success("Profile updated successfully");
      
      // Update initials after save
      const initials = [firstName, lastName]
        .filter(Boolean)
        .map(name => name?.charAt(0).toUpperCase())
        .join("");
      
      setUserInitials(initials || "U");
      
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container max-w-3xl py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>
      
      <div className="grid gap-6">
        {/* Profile Image */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Image</CardTitle>
            <CardDescription>
              Your profile image will be shown in the dashboard and on comments
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center space-x-6">
            <Avatar className="h-20 w-20">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="Profile" />
              ) : (
                <AvatarFallback className="text-xl">{userInitials}</AvatarFallback>
              )}
            </Avatar>
            
            <div>
              <Label htmlFor="avatar-upload" className="mb-2 block">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    disabled={uploadingAvatar}
                    className="cursor-pointer"
                    type="button"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    {uploadingAvatar ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        {avatarUrl ? "Change Image" : "Upload Image"}
                      </>
                    )}
                  </Button>
                </div>
              </Label>
              <Input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
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
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input 
                  id="last-name" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
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
                Your email address cannot be changed
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input 
                  id="company" 
                  value={company} 
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your company name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="job-title">Job Title</Label>
                <Input 
                  id="job-title" 
                  value={jobTitle} 
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Your job title"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website" 
                value={website} 
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
                type="url"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSaveProfile} 
              disabled={saving}
              className="ml-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 