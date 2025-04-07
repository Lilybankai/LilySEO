import { WhiteLabelProfile } from '@/components/pdf/WhiteLabelProfileSelector';

// Mock storage for white label profiles (would be replaced with database in production)
let mockProfiles: WhiteLabelProfile[] = [
  {
    id: 'default',
    name: 'LilySEO Default',
    companyName: 'LilySEO',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    logoUrl: '/images/logo.png',
    contactInfo: 'support@lilyseo.com',
    footerText: `© ${new Date().getFullYear()} LilySEO. All rights reserved.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

/**
 * Fetch all white label profiles for the current user
 * @returns List of white label profiles
 */
export const fetchWhiteLabelProfiles = async (): Promise<WhiteLabelProfile[]> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProfiles;
  } catch (error) {
    console.error('Error fetching white label profiles:', error);
    return [];
  }
};

/**
 * Get a single white label profile by ID
 * @param profileId ID of the profile to fetch
 * @returns The requested profile or null if not found
 */
export const getWhiteLabelProfile = async (profileId: string): Promise<WhiteLabelProfile | null> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const profile = mockProfiles.find(p => p.id === profileId);
    return profile || null;
  } catch (error) {
    console.error('Error fetching white label profile:', error);
    return null;
  }
};

/**
 * Create a new white label profile
 * @param profile The profile data to create
 * @returns The created profile
 */
export const createWhiteLabelProfile = async (
  profile: Omit<WhiteLabelProfile, 'id' | 'createdAt' | 'updatedAt'>
): Promise<WhiteLabelProfile> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const now = new Date().toISOString();
    const newProfile: WhiteLabelProfile = {
      ...profile,
      id: `profile-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    
    mockProfiles.push(newProfile);
    return newProfile;
  } catch (error) {
    console.error('Error creating white label profile:', error);
    throw error;
  }
};

/**
 * Update an existing white label profile
 * @param profile The updated profile data
 * @returns The updated profile
 */
export const updateWhiteLabelProfile = async (profile: WhiteLabelProfile): Promise<WhiteLabelProfile> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Find and update the profile
    const index = mockProfiles.findIndex(p => p.id === profile.id);
    if (index === -1) {
      throw new Error(`Profile with ID ${profile.id} not found`);
    }
    
    // Update with current timestamp
    const updatedProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    
    mockProfiles[index] = updatedProfile;
    return updatedProfile;
  } catch (error) {
    console.error('Error updating white label profile:', error);
    throw error;
  }
};

/**
 * Delete a white label profile
 * @param profileId ID of the profile to delete
 */
export const deleteWhiteLabelProfile = async (profileId: string): Promise<void> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Don't allow deleting the default profile
    if (profileId === 'default') {
      throw new Error('Cannot delete the default profile');
    }
    
    // Filter out the profile to delete
    mockProfiles = mockProfiles.filter(profile => profile.id !== profileId);
  } catch (error) {
    console.error('Error deleting white label profile:', error);
    throw error;
  }
}; 