import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Info, Plus, Save, Check, Edit, Copy, Trash } from 'lucide-react';
import { PdfTheme } from '@/context/ThemeContext';
import { logPdfEvent, safeHslToHex } from '@/utils';

// Define the white label profile interface
export interface WhiteLabelProfile {
  id: string;
  name: string;
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  contactInfo?: string;
  footerText?: string;
  createdAt: string;
  updatedAt: string;
}

interface WhiteLabelProfileSelectorProps {
  profiles: WhiteLabelProfile[];
  selectedProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
  onUpdateProfile: (profile: WhiteLabelProfile) => Promise<void>;
  onCreateProfile: (profile: Omit<WhiteLabelProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDeleteProfile: (profileId: string) => Promise<void>;
  onPreviewProfile: (profile: WhiteLabelProfile) => void;
  isLoading: boolean;
  theme: PdfTheme;
}

const WhiteLabelProfileSelector: React.FC<WhiteLabelProfileSelectorProps> = ({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onUpdateProfile,
  onCreateProfile,
  onDeleteProfile,
  onPreviewProfile,
  isLoading,
  theme,
}) => {
  const [activeTab, setActiveTab] = useState<'select' | 'create' | 'edit'>('select');
  const [selectedProfile, setSelectedProfile] = useState<WhiteLabelProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state for creating/editing profiles
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    logoUrl: '',
    contactInfo: '',
    footerText: ''
  });
  
  // When selected profile changes, update the form data
  useEffect(() => {
    if (selectedProfileId) {
      const profile = profiles.find(p => p.id === selectedProfileId);
      if (profile) {
        setSelectedProfile(profile);
        if (isEditing) {
          setFormData({
            name: profile.name,
            companyName: profile.companyName,
            primaryColor: profile.primaryColor,
            secondaryColor: profile.secondaryColor,
            logoUrl: profile.logoUrl || '',
            contactInfo: profile.contactInfo || '',
            footerText: profile.footerText || ''
          });
        }
      }
    }
  }, [selectedProfileId, profiles, isEditing]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle color changes
  const handleColorChange = (color: string, field: 'primaryColor' | 'secondaryColor') => {
    // Log the color change attempt
    logPdfEvent('profile-color-change', {
      field,
      newColor: color,
      isHsl: color?.startsWith('hsl')
    });
    
    // Process HSL colors safely
    let safeColor = color;
    if (color && color.startsWith('hsl')) {
      safeColor = safeHslToHex(color, field === 'primaryColor' ? '#3b82f6' : '#64748b');
      
      logPdfEvent('profile-color-processed', {
        field,
        original: color,
        processed: safeColor
      });
    }
    
    setFormData(prev => ({ ...prev, [field]: safeColor }));
  };
  
  // Handle profile selection
  const handleProfileSelect = (profileId: string) => {
    onSelectProfile(profileId);
    setIsEditing(false);
  };
  
  // Handle create profile
  const handleCreateProfile = async () => {
    try {
      // Log the profile creation attempt
      logPdfEvent('profile-create', {
        profileName: formData.name,
        primaryColor: formData.primaryColor,
        isPrimaryHsl: formData.primaryColor?.startsWith('hsl'),
        secondaryColor: formData.secondaryColor,
        isSecondaryHsl: formData.secondaryColor?.startsWith('hsl')
      });
      
      // Process HSL colors safely
      let safePrimaryColor = formData.primaryColor;
      if (safePrimaryColor && safePrimaryColor.startsWith('hsl')) {
        safePrimaryColor = safeHslToHex(safePrimaryColor, '#3b82f6');
      }
      
      let safeSecondaryColor = formData.secondaryColor;
      if (safeSecondaryColor && safeSecondaryColor.startsWith('hsl')) {
        safeSecondaryColor = safeHslToHex(safeSecondaryColor, '#64748b');
      }
      
      // Create the profile with safe colors
      await onCreateProfile({
        name: formData.name,
        companyName: formData.companyName,
        primaryColor: safePrimaryColor,
        secondaryColor: safeSecondaryColor,
        logoUrl: formData.logoUrl,
        contactInfo: formData.contactInfo,
        footerText: formData.footerText || `© ${new Date().getFullYear()} ${formData.companyName}. All rights reserved.`
      });
      
      // Log successful profile creation
      logPdfEvent('profile-created', {
        name: formData.name,
        originalPrimary: formData.primaryColor,
        processedPrimary: safePrimaryColor,
        originalSecondary: formData.secondaryColor,
        processedSecondary: safeSecondaryColor
      });
      
      // Reset form and switch to select tab
      setFormData({
        name: '',
        companyName: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        logoUrl: '',
        contactInfo: '',
        footerText: ''
      });
      setActiveTab('select');
    } catch (error) {
      console.error('Error creating profile:', error);
      logPdfEvent('profile-create-error', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      // Handle error (could add toast notification here)
    }
  };
  
  // Handle update profile
  const handleUpdateProfile = async () => {
    if (!selectedProfile) return;
    
    try {
      // Log the profile update attempt
      logPdfEvent('profile-update', {
        profileId: selectedProfile.id,
        profileName: formData.name,
        primaryColor: formData.primaryColor,
        isPrimaryHsl: formData.primaryColor?.startsWith('hsl'),
        secondaryColor: formData.secondaryColor,
        isSecondaryHsl: formData.secondaryColor?.startsWith('hsl')
      });
      
      // Process HSL colors safely
      let safePrimaryColor = formData.primaryColor;
      if (safePrimaryColor && safePrimaryColor.startsWith('hsl')) {
        safePrimaryColor = safeHslToHex(safePrimaryColor, '#3b82f6');
      }
      
      let safeSecondaryColor = formData.secondaryColor;
      if (safeSecondaryColor && safeSecondaryColor.startsWith('hsl')) {
        safeSecondaryColor = safeHslToHex(safeSecondaryColor, '#64748b');
      }
      
      // Update the profile with safe colors
      await onUpdateProfile({
        ...selectedProfile,
        name: formData.name,
        companyName: formData.companyName,
        primaryColor: safePrimaryColor,
        secondaryColor: safeSecondaryColor,
        logoUrl: formData.logoUrl,
        contactInfo: formData.contactInfo,
        footerText: formData.footerText,
        updatedAt: new Date().toISOString()
      });
      
      // Log successful profile update
      logPdfEvent('profile-updated', {
        profileId: selectedProfile.id,
        name: formData.name,
        originalPrimary: formData.primaryColor,
        processedPrimary: safePrimaryColor,
        originalSecondary: formData.secondaryColor,
        processedSecondary: safeSecondaryColor
      });
      
      setIsEditing(false);
      setActiveTab('select');
    } catch (error) {
      console.error('Error updating profile:', error);
      logPdfEvent('profile-update-error', { 
        profileId: selectedProfile.id,
        error: error instanceof Error ? error.message : String(error) 
      });
      // Handle error
    }
  };
  
  // Handle delete profile
  const handleDeleteProfile = async (profileId: string) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      try {
        await onDeleteProfile(profileId);
        if (selectedProfileId === profileId) {
          onSelectProfile(profiles[0]?.id || '');
        }
      } catch (error) {
        console.error('Error deleting profile:', error);
        // Handle error
      }
    }
  };
  
  // Handle preview profile
  const handlePreviewProfile = () => {
    if (!selectedProfile) return;
    
    if (isEditing) {
      // Preview the edited version
      onPreviewProfile({
        ...selectedProfile,
        name: formData.name,
        companyName: formData.companyName,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        logoUrl: formData.logoUrl,
        contactInfo: formData.contactInfo,
        footerText: formData.footerText
      });
    } else {
      // Preview the selected profile
      onPreviewProfile(selectedProfile);
    }
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">White Label Profiles</h3>
      <p className="text-sm text-muted-foreground">
        Customize how your PDF reports look with branded colors, logos, and contact information.
      </p>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="select">Select Profile</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="edit" disabled={!selectedProfile || isLoading}>
            Edit Profile
          </TabsTrigger>
        </TabsList>
        
        {/* Select Profile Tab */}
        <TabsContent value="select" className="space-y-4">
          {profiles.length === 0 ? (
            <div className="text-center p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">No white label profiles found.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setActiveTab('create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Select 
                value={selectedProfileId || undefined} 
                onValueChange={handleProfileSelect}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedProfile && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-semibold">{selectedProfile.name}</h4>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setIsEditing(true);
                          setActiveTab('edit');
                          setFormData({
                            name: selectedProfile.name,
                            companyName: selectedProfile.companyName,
                            primaryColor: selectedProfile.primaryColor,
                            secondaryColor: selectedProfile.secondaryColor,
                            logoUrl: selectedProfile.logoUrl || '',
                            contactInfo: selectedProfile.contactInfo || '',
                            footerText: selectedProfile.footerText || ''
                          });
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteProfile(selectedProfile.id)}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Company</Label>
                      <p className="text-sm">{selectedProfile.companyName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Contact</Label>
                      <p className="text-sm">{selectedProfile.contactInfo || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4 mb-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Primary Color</Label>
                      <div 
                        className="h-6 w-6 rounded-full border" 
                        style={{ backgroundColor: selectedProfile.primaryColor }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Secondary Color</Label>
                      <div 
                        className="h-6 w-6 rounded-full border" 
                        style={{ backgroundColor: selectedProfile.secondaryColor }}
                      />
                    </div>
                  </div>
                  
                  <Button onClick={handlePreviewProfile}>
                    Preview with This Profile
                  </Button>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Create Profile Tab */}
        <TabsContent value="create" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Profile Name</Label>
              <Input 
                id="name" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="My Brand Profile"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input 
                id="companyName" 
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Your Company, Inc."
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center space-x-2">
                <div 
                  className="h-8 w-8 rounded-full border" 
                  style={{ backgroundColor: formData.primaryColor }}
                />
                <Input 
                  id="primaryColor" 
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex items-center space-x-2">
                <div 
                  className="h-8 w-8 rounded-full border" 
                  style={{ backgroundColor: formData.secondaryColor }}
                />
                <Input 
                  id="secondaryColor" 
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleInputChange}
                  placeholder="#64748b"
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactInfo">Contact Information</Label>
            <Input 
              id="contactInfo" 
              name="contactInfo"
              value={formData.contactInfo}
              onChange={handleInputChange}
              placeholder="contact@yourcompany.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="footerText">Footer Text</Label>
            <Input 
              id="footerText" 
              name="footerText"
              value={formData.footerText}
              onChange={handleInputChange}
              placeholder={`© ${new Date().getFullYear()} ${formData.companyName || 'Your Company'}. All rights reserved.`}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setActiveTab('select')}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProfile}>
              <Save className="h-4 w-4 mr-2" />
              Create Profile
            </Button>
          </div>
        </TabsContent>
        
        {/* Edit Profile Tab */}
        <TabsContent value="edit" className="space-y-4">
          {selectedProfile && isEditing && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Profile Name</Label>
                  <Input 
                    id="edit-name" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="My Brand Profile"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-companyName">Company Name</Label>
                  <Input 
                    id="edit-companyName" 
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Your Company, Inc."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="h-8 w-8 rounded-full border" 
                      style={{ backgroundColor: formData.primaryColor }}
                    />
                    <Input 
                      id="edit-primaryColor" 
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleInputChange}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-secondaryColor">Secondary Color</Label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="h-8 w-8 rounded-full border" 
                      style={{ backgroundColor: formData.secondaryColor }}
                    />
                    <Input 
                      id="edit-secondaryColor" 
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleInputChange}
                      placeholder="#64748b"
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-contactInfo">Contact Information</Label>
                <Input 
                  id="edit-contactInfo" 
                  name="contactInfo"
                  value={formData.contactInfo}
                  onChange={handleInputChange}
                  placeholder="contact@yourcompany.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-footerText">Footer Text</Label>
                <Input 
                  id="edit-footerText" 
                  name="footerText"
                  value={formData.footerText}
                  onChange={handleInputChange}
                  placeholder={`© ${new Date().getFullYear()} ${formData.companyName}. All rights reserved.`}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setActiveTab('select');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="outline"
                  onClick={handlePreviewProfile}
                >
                  Preview
                </Button>
                <Button onClick={handleUpdateProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhiteLabelProfileSelector; 