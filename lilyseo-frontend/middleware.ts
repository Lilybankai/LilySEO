import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  console.log("Middleware executing for URL:", request.url);
  const res = NextResponse.next()

  // Check for test cookie
  const testCookie = request.cookies.get('login_test')?.value;
  console.log("Test cookie:", testCookie ? "Found" : "Not found");

  // Log all cookies for debugging
  const allCookies = request.cookies.getAll();
  console.log("All cookies:", allCookies.map(c => c.name).join(', '));
  
  // Log specific auth cookies if they exist
  const authCookie = request.cookies.get('sb-fleanljrxzbpayfsviec-auth-token')?.value;
  if (authCookie) {
    console.log("Auth cookie found, length:", authCookie.length);
    console.log("Auth cookie preview:", authCookie.substring(0, 20) + "...");
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name)?.value;
          console.log(`Getting cookie ${name}:`, cookie ? "Found" : "Not found");
          return cookie;
        },
        set(name: string, value: string, options: any) {
          console.log(`Setting cookie ${name}:`, value ? value.substring(0, 15) + "..." : "empty");
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          console.log(`Removing cookie ${name}`);
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get the session and log all cookies for debugging
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error("Error getting session:", sessionError.message);
  }
  
  console.log("Session:", session ? `Found (user: ${session.user.email})` : "Not found");
  
  if (session) {
    console.log("Session details:", {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: new Date(session.expires_at! * 1000).toISOString(),
    });
  }
  
  const url = new URL(request.url)

  // Protected routes
  const protectedRoutes = [
    '/dashboard', 
    '/projects', 
    '/settings',
    '/audits',
    '/todos',
    '/competitors'
  ]
  const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))
  console.log("Is protected route:", isProtectedRoute);

  // Auth routes
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email']
  const isAuthRoute = authRoutes.some(route => url.pathname === route)
  console.log("Is auth route:", isAuthRoute);

  // Handle root path
  if (url.pathname === '/') {
    console.log("Handling root path");
    if (session) {
      console.log("Redirecting to dashboard");
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    console.log("Redirecting to login");
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If accessing a protected route without a session, redirect to login
  if (isProtectedRoute && !session) {
    console.log("Redirecting to login from protected route");
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If accessing an auth route with a session, redirect to dashboard
  if (isAuthRoute && session) {
    console.log("Redirecting to dashboard from auth route");
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  console.log("Middleware completed, continuing to route");
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
} 