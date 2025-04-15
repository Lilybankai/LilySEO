import { NextRequest } from 'next/server';
import { GET, DELETE } from './route';
import { createClient } from '@/lib/supabase/server';

// Mock the supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Audit API Routes', () => {
  let mockRequest: NextRequest;
  let mockContext: { params: { id: string } };
  let mockSupabase: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock request and context
    mockRequest = new NextRequest(new URL('https://example.com/api/audits/123'));
    mockContext = { params: { id: '123' } };
    
    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      delete: jest.fn().mockReturnThis(),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('GET', () => {
    test('should return 401 if user is not authenticated', async () => {
      // Setup user to be null
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });
      
      const response = await GET(mockRequest, mockContext);
      const responseBody = await response.json();
      
      expect(response.status).toBe(401);
      expect(responseBody).toEqual({ error: 'Unauthorized' });
    });

    test('should return 404 if audit is not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null
      });
      
      const response = await GET(mockRequest, mockContext);
      const responseBody = await response.json();
      
      expect(response.status).toBe(404);
      expect(responseBody).toEqual({ error: 'Audit report not found' });
    });

    test('should return 500 if database error occurs', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      
      const response = await GET(mockRequest, mockContext);
      const responseBody = await response.json();
      
      expect(response.status).toBe(500);
      expect(responseBody).toEqual({ error: 'Database error' });
    });

    test('should return audit data if found', async () => {
      const mockAuditData = {
        id: '123',
        title: 'Test Audit',
        score: 85
      };
      
      mockSupabase.single.mockResolvedValue({
        data: mockAuditData,
        error: null
      });
      
      const response = await GET(mockRequest, mockContext);
      const responseBody = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({ data: mockAuditData });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
    });
  });

  describe('DELETE', () => {
    test('should return 401 if user is not authenticated', async () => {
      // Setup user to be null
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });
      
      const response = await DELETE(mockRequest, mockContext);
      const responseBody = await response.json();
      
      expect(response.status).toBe(401);
      expect(responseBody).toEqual({ error: 'Unauthorized' });
    });
    
    test('should return 404 if audit to delete is not found', async () => {
      // First single call returns null (audit not found)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });
      
      const response = await DELETE(mockRequest, mockContext);
      const responseBody = await response.json();
      
      expect(response.status).toBe(404);
      expect(responseBody).toEqual({ error: 'Audit report not found or access denied' });
    });
    
    test('should return success if deletion succeeds', async () => {
      // First single call returns the audit data (to check it exists)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: '123', user_id: 'user-123' },
        error: null
      });
      
      // Delete call returns no error
      mockSupabase.delete.mockReturnValueOnce({
        error: null
      });
      
      const response = await DELETE(mockRequest, mockContext);
      const responseBody = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({ success: true });
    });
  });
}); 