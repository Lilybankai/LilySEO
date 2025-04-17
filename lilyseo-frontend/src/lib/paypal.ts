import { Buffer } from 'buffer';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
// Determine PayPal API base URL based on environment (sandbox or live)
// Assume sandbox if not explicitly set or set to sandbox
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox'; 
const PAYPAL_API_BASE_URL = PAYPAL_ENVIRONMENT === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

// Basic in-memory cache for the access token
let paypalAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Fetches a PayPal access token using client credentials.
 * Caches the token until it expires.
 */
async function getPayPalAccessToken(): Promise<string | null> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.error("PayPal client ID or secret not configured.");
    return null;
  }

  // Check if cached token is still valid (with a 5-minute buffer)
  if (paypalAccessToken && paypalAccessToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return paypalAccessToken.token;
  }

  console.log(`Fetching new PayPal access token from ${PAYPAL_API_BASE_URL}...`);
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await fetch(`${PAYPAL_API_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      cache: 'no-store' // Ensure fresh request for token
    });

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        console.error("Failed to parse PayPal token error response as JSON");
      }
      console.error("Error fetching PayPal access token:", response.status, errorData);
      throw new Error(`PayPal token fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.access_token) {
         throw new Error('PayPal token response did not contain access_token');
    }
    const expiresIn = data.expires_in || 3600; // Default to 1 hour

    paypalAccessToken = {
      token: data.access_token,
      expiresAt: Date.now() + (expiresIn * 1000)
    };
    
    console.log("Successfully fetched new PayPal access token.");
    return paypalAccessToken.token;

  } catch (error) {
    console.error("Error in getPayPalAccessToken:", error);
    paypalAccessToken = null; // Clear cache on error
    return null;
  }
}

/**
 * Cancels a PayPal subscription using the PayPal REST API.
 */
export async function cancelPayPalSubscriptionAPI(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  if (!subscriptionId) {
      return { success: false, error: "Subscription ID is required for cancellation." };
  }
  console.log(`Attempting to cancel PayPal Subscription ID: ${subscriptionId}`);
  const accessToken = await getPayPalAccessToken();

  if (!accessToken) {
    return { success: false, error: "Could not authenticate with PayPal." };
  }

  try {
    const response = await fetch(`${PAYPAL_API_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        // Consider adding 'PayPal-Request-Id' for traceability
      },
      body: JSON.stringify({ reason: "User downgraded plan via application." })
    });

    // PayPal returns 204 No Content on successful cancellation
    if (response.status === 204) {
      console.log(`Successfully cancelled PayPal subscription ${subscriptionId} via API.`);
      return { success: true };
    } else {
      let errorData = { message: `Request failed with status ${response.status}` }; 
      try {
        errorData = await response.json();
      } catch (e) {
         console.error("Failed to parse PayPal cancellation error response as JSON");
      } 
      console.error(`Error cancelling PayPal subscription ${subscriptionId}:`, response.status, errorData);
      return { success: false, error: `PayPal API Error (${response.status}): ${errorData.message || 'Unknown cancellation error'}` };
    }

  } catch (error) {
    console.error(`Network/fetch error cancelling PayPal subscription ${subscriptionId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown network error occurred while cancelling the subscription." };
  }
} 