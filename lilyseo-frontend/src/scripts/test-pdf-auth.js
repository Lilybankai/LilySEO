// Simple test script to verify PDF API authentication
const fetch = require('node-fetch');

// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_KEY = process.env.PDF_API_KEY || '';
const TEST_TOKEN = process.env.TEST_TOKEN || '';
const TEST_USER_ID = process.env.TEST_USER_ID || '';

async function testPdfAuthentication() {
  console.log('Testing PDF API authentication...');
  console.log(`API URL: ${API_URL}`);
  
  try {
    // Test direct API endpoint
    const response = await fetch(`${API_URL}/api/pdf/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'x-user-id': TEST_USER_ID,
      },
      body: JSON.stringify({
        projectId: 'test-project',
        templateId: 'template1',
        theme: {
          primaryColor: '#000000',
          logoUrl: '',
        }
      }),
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success:', data);
    } else {
      const text = await response.text();
      console.error('Error response:', text);
      try {
        const errorJson = JSON.parse(text);
        console.error('Parsed error:', errorJson);
      } catch (e) {
        console.error('Could not parse error as JSON');
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPdfAuthentication(); 