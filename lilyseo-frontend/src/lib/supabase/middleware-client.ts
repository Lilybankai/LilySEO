import { createServerClient } from '@supabase/ssr'
import { Database } from './database.types'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Creates a Supabase client for Next.js Middleware
 * This doesn't use next/headers so it's safe for the pages directory
 */
export function createMiddlewareClient(
  req: NextRequest,
  res: NextResponse
) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
} 