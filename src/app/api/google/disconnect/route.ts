import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json({ error: "Failed to authenticate session" }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clear the refresh token from the user's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ google_refresh_token: null })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Error disconnecting Google account (clearing token):', updateError)
      return NextResponse.json({ error: `Failed to disconnect Google account: ${updateError.message}` }, { status: 500 })
    }

    console.log(`Successfully disconnected Google account for user: ${session.user.id}`);
    return NextResponse.json({ message: 'Successfully disconnected Google account' })

  } catch (error: any) {
    console.error('Error in /api/google/disconnect:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
} 