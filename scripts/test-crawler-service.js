// Test script to check if the crawler service is available
const fetch = require('node-fetch');

const CRAWLER_SERVICE_URL = process.env.CRAWLER_SERVICE_URL || 'http://localhost:3001';

async function testCrawlerService() {
  try {
    console.log(`Testing crawler service at ${CRAWLER_SERVICE_URL}...`);
    
    // Try to access the health endpoint
    const response = await fetch(`${CRAWLER_SERVICE_URL}/api/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Crawler service is available!');
      console.log('Response:', data);
      return true;
    } else {
      console.error(`❌ Crawler service returned status: ${response.status}`);
      const errorText = await response.text();
      console.error('Error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to connect to crawler service:');
    console.error(error.message);
    return false;
  }
}

// Run the test
testCrawlerService()
  .then(success => {
    if (!success) {
      console.log('\nPossible solutions:');
      console.log('1. Make sure the crawler service is running');
      console.log('2. Check your .env.local file and ensure CRAWLER_SERVICE_URL is set correctly');
      console.log('3. Verify network connectivity to the crawler service');
    }
  }); 