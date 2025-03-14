import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_URL}/api/google/callback` : 'http://localhost:3000/api/google/callback'

export async function GET(request: Request) {
  try {
    // Get the authorization code and state from the query parameters
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const stateParam = searchParams.get('state')
    
    if (!code || !stateParam) {
      return new Response('Missing code or state parameter', { status: 400 })
    }
    
    // Parse the state parameter
    let state: { projectId: string; userId: string }
    try {
      state = JSON.parse(Buffer.from(stateParam, 'base64').toString())
    } catch (error) {
      return new Response('Invalid state parameter', { status: 400 })
    }
    
    // Authenticate the user
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session || session.user.id !== state.userId) {
      return new Response('Unauthorized', { status: 401 })
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
      return new Response('Failed to exchange code for tokens', { status: 500 })
    }
    
    const tokenData = await tokenResponse.json()
    
    // Get the user's Search Console sites
    const sitesResponse = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })
    
    if (!sitesResponse.ok) {
      const errorData = await sitesResponse.json()
      console.error('Error fetching Search Console sites:', errorData)
      return new Response('Failed to fetch Search Console sites', { status: 500 })
    }
    
    const sitesData = await sitesResponse.json()
    
    // Get the project URL
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('url')
      .eq('id', state.projectId)
      .single()
    
    if (projectError || !project) {
      console.error('Error fetching project:', projectError)
      return new Response('Failed to fetch project', { status: 500 })
    }
    
    // Find the matching site in Search Console
    const projectUrl = new URL(project.url)
    const projectDomain = projectUrl.hostname
    
    let matchingSite = null
    for (const site of sitesData.siteEntry || []) {
      const siteUrl = new URL(site.siteUrl)
      if (siteUrl.hostname === projectDomain) {
        matchingSite = site.siteUrl
        break
      }
    }
    
    if (!matchingSite) {
      // Redirect to the project page with an error
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/projects/${state.projectId}?error=no_matching_site`,
        },
      })
    }
    
    // Calculate token expiry
    const expiresIn = tokenData.expires_in || 3600
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString()
    
    // Store the tokens in the database
    const { error: insertError } = await supabase
      .from('google_search_console_connections')
      .upsert({
        user_id: session.user.id,
        project_id: state.projectId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expiry: tokenExpiry,
        site_url: matchingSite,
      })
    
    if (insertError) {
      console.error('Error storing tokens:', insertError)
      return new Response('Failed to store tokens', { status: 500 })
    }
    
    // Redirect to the project page with a success message
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/projects/${state.projectId}?success=gsc_connected`,
      },
    })
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error)
    return new Response('Internal server error', { status: 500 })
  }
} 