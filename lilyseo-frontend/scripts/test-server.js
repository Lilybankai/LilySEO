// Simple script to test the crawler service using axios
const axios = require('axios');

// Configuration
const CRAWLER_SERVICE_URL = 'http://localhost:3001';
const COMPETITOR_ID = '8c217e13-f7e7-4acd-b5c1-780e899a4c91';

async function testService() {
  console.log(`Testing service at ${CRAWLER_SERVICE_URL}`);
  
  try {
    // Test health endpoint
    console.log('\nTesting health endpoint...');
    try {
      const healthResponse = await axios.get(`${CRAWLER_SERVICE_URL}/api/health`);
      console.log(`Status: ${healthResponse.status}`);
      console.log(`Response: ${JSON.stringify(healthResponse.data)}`);
      console.log('Health endpoint OK!');
    } catch (error) {
      console.error(`Health endpoint error: ${error.message}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Data: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    // Test analyze endpoint
    console.log('\nTesting analyze endpoint...');
    try {
      const analyzeResponse = await axios.post(
        `${CRAWLER_SERVICE_URL}/api/competitors/analyze/${COMPETITOR_ID}`, 
        { options: {} }
      );
      console.log(`Status: ${analyzeResponse.status}`);
      console.log(`Response: ${JSON.stringify(analyzeResponse.data)}`);
      console.log('Analyze endpoint OK!');
    } catch (error) {
      console.error(`Analyze endpoint error: ${error.message}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Data: ${JSON.stringify(error.response.data)}`);
      }
    }
    
  } catch (error) {
    console.error(`General error: ${error.message}`);
  }
}

testService(); 