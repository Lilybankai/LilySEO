import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info, Plus, Save, Check, Edit, Copy, Trash, Loader2, PlusCircle, Eye } from 'lucide-react';
import { PdfTheme } from '@/context/ThemeContext';
import { logPdfEvent, safeHslToHex } from '@/utils';

// Define the white label profile interface
export interface WhiteLabelProfile {
  id: string;
  name: string;
  theme: PdfTheme;
  primaryColor: string;
  logoUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  primaryColor: string;
  logoUrl: string;
}

interface WhiteLabelProfileSelectorProps {
  profiles: WhiteLabelProfile[];
  selectedProfileId: string | null;
  onProfileSelect: (profileId: string) => void;
  onProfileUpdate: (profile: WhiteLabelProfile) => void;
  onProfileCreate: (profile: Partial<WhiteLabelProfile>) => void;
  onProfileDelete: (profileId: string) => void;
  onPreviewProfile?: (profile: WhiteLabelProfile) => void;
  isLoading?: boolean;
  theme?: PdfTheme;
}

const defaultTheme: PdfTheme = {
  primaryColor: '#000000',
  logoUrl: '',
  clientName: '',
  preparedBy: '',
  customNotes: '',
  coverStyle: 1,
  includeOptions: {
    executiveSummary: true,
    technicalSEO: true,
    onPageSEO: true,
    offPageSEO: true,
    performance: true,
    userExperience: true,
    insights: true,
    recommendations: true,
    charts: true,
    branding: true,
    structuredData: true,
    internalLinks: true,
  }
};

const WhiteLabelProfileSelector: React.FC<WhiteLabelProfileSelectorProps> = ({
  profiles,
  selectedProfileId,
  onProfileSelect,
  onProfileUpdate,
  onProfileCreate,
  onProfileDelete,
  onPreviewProfile = () => {},
  isLoading = false,
  theme = defaultTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'select' | 'create' | 'edit'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    primaryColor: '#000000',
    logoUrl: '',
  });
  
  // Get the currently selected profile
  const selectedProfile = selectedProfileId ? profiles.find(p => p.id === selectedProfileId) : null;

  // Update form when selected profile changes
  useEffect(() => {
    if (selectedProfile) {
          setFormData({
        name: selectedProfile.name,
        primaryColor: selectedProfile.primaryColor,
        logoUrl: selectedProfile.logoUrl || '',
      });
    }
  }, [selectedProfile]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle color input changes
  const handleColorChange = (color: string, field: 'primaryColor') => {
    setFormData(prev => ({ ...prev, [field]: color }));
  };
  
  // Handle profile selection
  const handleProfileSelect = (profileId: string) => {
    onProfileSelect(profileId);
  };
  
  // Handle creating a new profile
  const handleCreateProfile = async () => {
    if (!formData.name) {
      alert('Please enter a profile name');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Make sure primary color is valid hex
      const safePrimaryColor = formData.primaryColor.startsWith('#') 
        ? formData.primaryColor 
        : '#' + formData.primaryColor;
      
      // Create the profile with safe colors
      await onProfileCreate({
        name: formData.name,
        theme: theme,
        primaryColor: safePrimaryColor,
        logoUrl: formData.logoUrl || '',
      });
      
      // Reset form
      setFormData({
        name: '',
        primaryColor: '#000000',
        logoUrl: '',
      });
      
      // Switch back to select tab
      setActiveTab('select');
    } catch (error) {
      console.error('Failed to create profile:', error);
      alert('Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating a profile
  const handleUpdateProfile = async () => {
    if (!selectedProfile) return;
    
    if (!formData.name) {
      alert('Please enter a profile name');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Make sure primary color is valid hex
      const safePrimaryColor = formData.primaryColor.startsWith('#') 
        ? formData.primaryColor 
        : '#' + formData.primaryColor;
      
      // Update the profile with safe colors
      await onProfileUpdate({
        ...selectedProfile,
        name: formData.name,
        theme: theme,
        primaryColor: safePrimaryColor,
        logoUrl: formData.logoUrl || '',
      });
      
      // Switch back to select tab
      setActiveTab('select');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a profile
  const handleDeleteProfile = async (profileId: string) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      try {
        await onProfileDelete(profileId);
        if (selectedProfileId === profileId) {
          onProfileSelect(profiles[0]?.id || '');
        }
      } catch (error) {
        console.error('Failed to delete profile:', error);
        alert('Failed to delete profile. Please try again.');
      }
    }
  };
  
  // Handle previewing a profile
  const handlePreviewProfile = () => {
    if (selectedProfile) {
      onPreviewProfile(selectedProfile);
    }
  };
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab as any}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="select">Select Profile</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        <TabsTrigger value="edit" disabled={!selectedProfile}>Edit Profile</TabsTrigger>
        </TabsList>
        
      <TabsContent value="select" className="pt-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : profiles.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Profiles Found</CardTitle>
              <CardDescription>
                Create a new white label profile to customize your PDF reports.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => setActiveTab('create')}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Profile
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {profiles.map((profile) => (
              <Card 
                key={profile.id} 
                className={`cursor-pointer transition-all ${
                  selectedProfileId === profile.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleProfileSelect(profile.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData({
                            name: profile.name,
                            primaryColor: profile.primaryColor,
                            logoUrl: profile.logoUrl || '',
                          });
                          setActiveTab('edit');
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProfile(profile.id);
                        }}
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.logoUrl && (
                      <img 
                        src={profile.logoUrl} 
                        alt={`${profile.name} logo`} 
                        className="h-16 object-contain" 
                      />
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                      <div 
                        className="h-6 w-6 rounded-full border" 
                          style={{ backgroundColor: profile.primaryColor }}
                      />
                        <span className="text-xs text-muted-foreground">Primary</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                </Card>
            ))}
            </div>
          )}
        </TabsContent>
        
      <TabsContent value="create" className="pt-4">
        <Card>
          <CardHeader>
            <CardTitle>Create White Label Profile</CardTitle>
            <CardDescription>
              Create a new branding profile to use in your PDF reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Profile Name</Label>
              <Input 
                id="name" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="My Company Brand"
              />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                <div 
                    className="w-10 h-10 rounded border" 
                  style={{ backgroundColor: formData.primaryColor }}
                />
                <Input 
                  id="primaryColor" 
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                    placeholder="#0066cc"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input 
              id="logoUrl" 
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/logo.png"
            />
              {formData.logoUrl && (
                <div className="mt-2 p-2 border rounded">
                  <img 
                    src={formData.logoUrl} 
                    alt="Logo preview" 
                    className="h-16 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      alert('Failed to load image. Please check the URL.');
                    }}
            />
          </div>
              )}
          </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab('select')}>
              Cancel
            </Button>
            <Button onClick={handleCreateProfile} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
              Create Profile
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        </TabsContent>
        
      <TabsContent value="edit" className="pt-4">
        {selectedProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile: {selectedProfile.name}</CardTitle>
              <CardDescription>
                Update your white label profile settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Profile Name</Label>
                  <Input 
                    id="edit-name" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  placeholder="My Company Brand"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <div 
                      className="w-10 h-10 rounded border" 
                      style={{ backgroundColor: formData.primaryColor }}
                    />
                    <Input 
                      id="edit-primaryColor" 
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleInputChange}
                      placeholder="#0066cc"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-logoUrl">Logo URL</Label>
                <Input 
                  id="edit-logoUrl" 
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/logo.png"
                />
                {formData.logoUrl && (
                  <div className="mt-2 p-2 border rounded">
                    <img 
                      src={formData.logoUrl} 
                      alt="Logo preview" 
                      className="h-16 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        alert('Failed to load image. Please check the URL.');
                      }}
                />
              </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('select')}>
                  Cancel
                </Button>
              <div className="flex space-x-2">
                <Button 
                  variant="secondary" 
                  onClick={handlePreviewProfile}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button onClick={handleUpdateProfile} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                  Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
          )}
        </TabsContent>
      </Tabs>
  );
};

export default WhiteLabelProfileSelector; 