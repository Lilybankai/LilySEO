// Script to test the competitor analysis endpoint in the crawler service
// Uses the global fetch API in Node.js 18+ instead of importing node-fetch

// Configuration
const CRAWLER_SERVICE_URL = process.env.CRAWLER_SERVICE_URL || 'http://s4og044go8wogw8o0skooco8.37.27.219.0.sslip.io';
const COMPETITOR_ID = '8c217e13-f7e7-4acd-b5c1-780e899a4c91'; // Replace with your actual competitor ID

async function testCompetitorAnalysis() {
  console.log(`Testing competitor analysis at ${CRAWLER_SERVICE_URL}`);
  console.log(`Using competitor ID: ${COMPETITOR_ID}`);
  
  try {
    // First check if the health endpoint is responding
    console.log('1. Checking health endpoint...');
    try {
      const healthResponse = await fetch(`${CRAWLER_SERVICE_URL}/api/health`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`   Status: ${healthResponse.status}`);
      const healthData = await healthResponse.text();
      console.log(`   Response: ${healthData}`);
      
      if (healthResponse.ok) {
        console.log('   ✅ Health endpoint OK!');
      } else {
        console.error(`   ❌ Health endpoint failed with status: ${healthResponse.status}`);
        console.error(`   Error: ${healthData}`);
      }
    } catch (error) {
      console.error('   ❌ Health endpoint connection error:');
      console.error(`   ${error.message}`);
    }
    
    // Now test the analyze endpoint
    console.log('\n2. Testing analyze endpoint...');
    console.log(`   Competitor ID: ${COMPETITOR_ID}`);
    const analyzeEndpoint = `${CRAWLER_SERVICE_URL}/api/competitors/analyze/${COMPETITOR_ID}`;
    console.log(`   URL: ${analyzeEndpoint}`);
    
    try {
      const analyzeResponse = await fetch(analyzeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ options: {} })
      });
      
      console.log(`   Status: ${analyzeResponse.status}`);
      
      const responseBody = await analyzeResponse.text();
      console.log(`   Response: ${responseBody}`);
      
      if (analyzeResponse.ok) {
        console.log('   ✅ Competitor analysis request successful!');
        return true;
      } else {
        console.error('   ❌ Competitor analysis request failed!');
      }
    } catch (error) {
      console.error('   ❌ Connection error:');
      console.error(`   ${error.message}`);
    }
    
    // Try alternate endpoint format
    console.log('\n3. Testing alternate endpoint format...');
    const alternateEndpoint = `${CRAWLER_SERVICE_URL}/api/competitors/${COMPETITOR_ID}/analyze`;
    console.log(`   URL: ${alternateEndpoint}`);
    
    try {
      const altResponse = await fetch(alternateEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ options: {} })
      });
      
      console.log(`   Status: ${altResponse.status}`);
      
      const altResponseBody = await altResponse.text();
      console.log(`   Response: ${altResponseBody}`);
      
      if (altResponse.ok) {
        console.log('   ✅ Alternate endpoint request successful!');
        return true;
      } else {
        console.error('   ❌ Alternate endpoint request failed!');
      }
    } catch (error) {
      console.error('   ❌ Connection error:');
      console.error(`   ${error.message}`);
    }
    
    return false;
  } catch (error) {
    console.error('❌ General test failure:');
    console.error(error.message);
    return false;
  }
}

// Run the test
testCompetitorAnalysis()
  .then(success => {
    if (!success) {
      console.log('\nPossible issues:');
      console.log('1. The crawler service might be down or not accessible');
      console.log('2. The endpoint path might be different than what we tried');
      console.log('3. The service might require authentication');
      console.log('4. There might be network/firewall restrictions');
      console.log('\nPossible solutions:');
      console.log('1. Verify the crawler service API routes in crawler-service/src/routes/');
      console.log('2. Check if the service requires authentication tokens');
      console.log('3. Look in crawler-service logs for any failed requests');
    }
  }); 