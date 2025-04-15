import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server'
// Removed redirect from next/navigation as we use NextResponse.redirect now

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_URL}/api/google/callback` : 'http://localhost:3000/api/google/callback'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' // Base URL for redirecting

// IMPORTANT: Replace with your actual pgsodium key ID (UUID)
// Store this securely, e.g., in Supabase Vault or environment variables
const PGSODIUM_KEY_ID = process.env.TOKEN_ENCRYPTION_KEY_ID; // Example: process.env.PGSODIUM_KEY_ID

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const errorParam = searchParams.get('error'); // Check for errors from Google

  const settingsUrl = `${APP_URL}/dashboard/settings`; // Define settings URL once

  if (errorParam) {
    console.error(`Error from Google OAuth: ${errorParam}`);
    // Redirect back to settings with an error
    return NextResponse.redirect(`${settingsUrl}?error=google_auth_failed&message=${encodeURIComponent(errorParam)}`);
  }

  if (!code || !stateParam) {
    console.error('Callback missing code or state parameter');
    return NextResponse.redirect(`${settingsUrl}?error=google_auth_failed&message=Invalid_callback_parameters`);
  }
  
  // Parse the state parameter (expecting only userId now)
  let state: { userId: string }
  try {
    state = JSON.parse(Buffer.from(stateParam, 'base64').toString())
    if (!state.userId) throw new Error('Missing userId in state');
  } catch (error) {
    console.error('Invalid state parameter:', error);
    return NextResponse.redirect(`${settingsUrl}?error=google_auth_failed&message=Invalid_state`);
  }
  
  // Check for pgsodium key
  if (!PGSODIUM_KEY_ID) {
      console.error("TOKEN_ENCRYPTION_KEY_ID is not set in environment variables.");
      return NextResponse.redirect(`${settingsUrl}?error=google_auth_failed&message=Server_configuration_error`);
  }

  try {
    // Authenticate the user
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    // Validate the session user matches the user ID from the state
    if (!session || session.user.id !== state.userId) {
      console.error('Session user does not match state userId');
      return NextResponse.redirect(`${settingsUrl}?error=google_auth_failed&message=User_mismatch`);
    }
    
    // Exchange the authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Error exchanging code for tokens:', errorData)
      throw new Error(`Failed to exchange code for tokens: ${errorData.error_description || errorData.error || 'Unknown error'}`);
    }
    
    const tokenData = await tokenResponse.json()
    
    // We only need the refresh token for persistent access
    const refreshToken = tokenData.refresh_token;

    if (!refreshToken) {
      // This can happen if the user has previously granted consent without offline access
      // or if prompt=consent wasn't used.
      console.error('No refresh token received from Google. Ensure access_type=offline and prompt=consent are used.');
      throw new Error('Failed to obtain refresh token from Google. Please try connecting again.');
    }

    // Encrypt the refresh token using pgsodium
    // Note: We use the Supabase client associated with the service_role 
    // implicitly via createClient() in a Route Handler to call security definer functions.
    // Ensure the service_role has execute permission on pgsodium functions.
    const { data: encryptedToken, error: encryptError } = await supabase.rpc(
      'pgsodium_crypto_aead_det_encrypt',
      {
        plaintext: refreshToken,
        additional: JSON.stringify({ user_id: session.user.id }), // Contextual data
        key_id: PGSODIUM_KEY_ID
      }
    );

    if (encryptError || !encryptedToken) {
        console.error('Failed to encrypt refresh token:', encryptError);
        throw new Error('Could not securely store Google connection details.');
    }

    // Store the *encrypted* token (as bytea) in the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ google_refresh_token: encryptedToken }) // Store the bytea result
      .eq('id', session.user.id);
    
    if (updateError) {
      console.error('Error storing encrypted refresh token:', updateError);
      throw new Error(`Failed to store Google connection details: ${updateError.message}`);
    }

    // *** Removed project and GSC site verification logic ***
    
    // Redirect to the settings page with a success message
    return NextResponse.redirect(`${settingsUrl}?success=google_connected`);

  } catch (error: any) {
    console.error('Error handling Google OAuth callback:', error);
    const errorMessage = encodeURIComponent(error.message || 'Internal server error during Google callback');
    // Redirect back to settings with an error
    return NextResponse.redirect(`${settingsUrl}?error=google_auth_failed&message=${errorMessage}`);
  }
} 