import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  fetchWhiteLabelSettings, 
  saveWhiteLabelSettings, 
  toggleWhiteLabelActive, 
  uploadLogo,
  checkWhiteLabelAccess,
  clearWhiteLabelSettingsCache
} from './white-label';
import { createClient } from '@/lib/supabase/client';

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}));

describe('White Label Service', () => {
  let mockSupabase: any;
  
  beforeEach(() => {
    // Clear the cache before each test
    clearWhiteLabelSettingsCache();
    
    // Setup mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      storage: {
        from: vi.fn().mockReturnThis(),
        upload: vi.fn(),
        getPublicUrl: vi.fn()
      },
      auth: {
        getUser: vi.fn(),
        getSession: vi.fn()
      }
    };
    
    (createClient as any).mockReturnValue(mockSupabase);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('fetchWhiteLabelSettings', () => {
    it('should fetch white label settings from Supabase', async () => {
      const mockSettings = { 
        id: '123', 
        user_id: 'user123', 
        company_name: 'Test Company',
        is_active: true
      };
      
      mockSupabase.single.mockResolvedValue({ data: mockSettings, error: null });
      
      const result = await fetchWhiteLabelSettings();
      
      expect(mockSupabase.from).toHaveBeenCalledWith('white_label_settings');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.single).toHaveBeenCalled();
      expect(result).toEqual(mockSettings);
    });
    
    it('should return null if there is an error', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Test error') });
      
      const result = await fetchWhiteLabelSettings();
      
      expect(result).toBeNull();
    });
    
    it('should use cached settings if available and not expired', async () => {
      const mockSettings = { 
        id: '123', 
        user_id: 'user123', 
        company_name: 'Test Company',
        is_active: true
      };
      
      // First call to populate the cache
      mockSupabase.single.mockResolvedValue({ data: mockSettings, error: null });
      await fetchWhiteLabelSettings();
      
      // Second call should use the cache
      const result = await fetchWhiteLabelSettings();
      
      // Supabase should only be called once
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSettings);
    });
  });
  
  describe('saveWhiteLabelSettings', () => {
    it('should update existing settings', async () => {
      const mockSettings = { 
        company_name: 'Updated Company',
        primary_color: '#FF0000'
      };
      
      const mockExistingSettings = { id: '123' };
      const mockResult = { 
        id: '123', 
        user_id: 'user123', 
        company_name: 'Updated Company',
        primary_color: '#FF0000',
        is_active: true
      };
      
      mockSupabase.single.mockResolvedValueOnce({ data: mockExistingSettings, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: mockResult, error: null });
      
      const result = await saveWhiteLabelSettings(mockSettings);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('white_label_settings');
      expect(mockSupabase.update).toHaveBeenCalledWith(mockSettings);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
      expect(result).toEqual(mockResult);
    });
    
    it('should create new settings if none exist', async () => {
      const mockSettings = { 
        company_name: 'New Company',
        primary_color: '#00FF00'
      };
      
      const mockUser = { id: 'user123' };
      const mockResult = { 
        id: '123', 
        user_id: 'user123', 
        company_name: 'New Company',
        primary_color: '#00FF00',
        is_active: false
      };
      
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null });
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.single.mockResolvedValueOnce({ data: mockResult, error: null });
      
      const result = await saveWhiteLabelSettings(mockSettings);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('white_label_settings');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
    
    it('should return null if there is an error', async () => {
      const mockSettings = { company_name: 'Test Company' };
      
      mockSupabase.single.mockResolvedValueOnce({ data: { id: '123' }, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('Test error') });
      
      const result = await saveWhiteLabelSettings(mockSettings);
      
      expect(result).toBeNull();
    });
  });
  
  describe('toggleWhiteLabelActive', () => {
    it('should toggle white label active status', async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: '123' }, error: null });
      mockSupabase.update.mockResolvedValue({ error: null });
      
      const result = await toggleWhiteLabelActive(true);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('white_label_settings');
      expect(mockSupabase.update).toHaveBeenCalledWith({ is_active: true });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
      expect(result).toBe(true);
    });
    
    it('should return false if no settings exist', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });
      
      const result = await toggleWhiteLabelActive(true);
      
      expect(result).toBe(false);
    });
    
    it('should return false if there is an error', async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: '123' }, error: null });
      mockSupabase.update.mockResolvedValue({ error: new Error('Test error') });
      
      const result = await toggleWhiteLabelActive(true);
      
      expect(result).toBe(false);
    });
  });
  
  describe('uploadLogo', () => {
    it('should upload a logo file and return the public URL', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      const mockUser = { id: 'user123' };
      const mockPublicUrl = 'https://example.com/logo.png';
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.storage.upload.mockResolvedValue({ data: {}, error: null });
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: mockPublicUrl } });
      
      // Mock Date.now() to return a consistent value
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => 1234567890);
      
      const result = await uploadLogo(mockFile);
      
      // Restore Date.now
      Date.now = originalDateNow;
      
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('white-label');
      expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
        'logos/user123-1234567890.png',
        mockFile,
        expect.any(Object)
      );
      expect(mockSupabase.storage.getPublicUrl).toHaveBeenCalledWith('logos/user123-1234567890.png');
      expect(result).toBe(mockPublicUrl);
    });
    
    it('should return null if user is not authenticated', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      
      const result = await uploadLogo(mockFile);
      
      expect(result).toBeNull();
    });
    
    it('should return null if there is an upload error', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      const mockUser = { id: 'user123' };
      
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
      mockSupabase.storage.upload.mockResolvedValue({ data: null, error: new Error('Test error') });
      
      const result = await uploadLogo(mockFile);
      
      expect(result).toBeNull();
    });
  });
  
  describe('checkWhiteLabelAccess', () => {
    it('should return true for pro users with active subscription', async () => {
      const mockProfile = { 
        subscription_tier: 'pro', 
        subscription_status: 'active' 
      };
      
      mockSupabase.single.mockResolvedValue({ data: mockProfile, error: null });
      
      const result = await checkWhiteLabelAccess();
      
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.select).toHaveBeenCalledWith('subscription_tier, subscription_status');
      expect(result).toBe(true);
    });
    
    it('should return true for enterprise users with trialing subscription', async () => {
      const mockProfile = { 
        subscription_tier: 'enterprise', 
        subscription_status: 'trialing' 
      };
      
      mockSupabase.single.mockResolvedValue({ data: mockProfile, error: null });
      
      const result = await checkWhiteLabelAccess();
      
      expect(result).toBe(true);
    });
    
    it('should return false for free users', async () => {
      const mockProfile = { 
        subscription_tier: 'free', 
        subscription_status: 'active' 
      };
      
      mockSupabase.single.mockResolvedValue({ data: mockProfile, error: null });
      
      const result = await checkWhiteLabelAccess();
      
      expect(result).toBe(false);
    });
    
    it('should return false for pro users with inactive subscription', async () => {
      const mockProfile = { 
        subscription_tier: 'pro', 
        subscription_status: 'inactive' 
      };
      
      mockSupabase.single.mockResolvedValue({ data: mockProfile, error: null });
      
      const result = await checkWhiteLabelAccess();
      
      expect(result).toBe(false);
    });
    
    it('should return false if there is an error', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: new Error('Test error') });
      
      const result = await checkWhiteLabelAccess();
      
      expect(result).toBe(false);
    });
  });
}); 