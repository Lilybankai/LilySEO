// Simple script to test the dashboard route
import fetch from 'node-fetch';

async function testDashboard() {
  try {
    console.log('Testing dashboard route...');
    const response = await fetch('http://localhost:3000/dashboard', {
      headers: {
        'Cookie': 'sb-fleanljrxzbpayfsviec-auth-token=YOUR_AUTH_TOKEN_HERE' // Replace with actual token if needed
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Response preview:', text.substring(0, 200) + '...');
    
    return { status: response.status, text };
  } catch (error) {
    console.error('Error testing dashboard:', error);
  }
}

// Run the test
testDashboard(); 