// Simple script to test AI endpoints
import fetch from 'node-fetch';

async function testOpenAI() {
  try {
    console.log('Testing OpenAI connection...');
    const response = await fetch('http://localhost:3000/api/test-openai');
    
    const data = await response.json();
    console.log('OpenAI test response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error testing OpenAI connection:', error);
  }
}

// Run the test
testOpenAI(); 