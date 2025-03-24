import { createServerClient } from '@supabase/ssr'
import { Database } from './database.types'
import { NextApiRequest, NextApiResponse } from 'next'

/**
 * Creates a Supabase server client for the Pages Router
 * This version doesn't use next/headers and is compatible
 * with the pages/ directory
 */
export function createPagesServerClient(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies[name]
        },
        set(name, value, options) {
          res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`)
        },
        remove(name, options) {
          res.setHeader(
            'Set-Cookie',
            `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
          )
        },
      },
    }
  )
}

/**
 * Creates a Supabase admin client for the Pages Router
 * This has enhanced privileges using the service role key
 */
export function createPagesAdminClient(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies[name]
        },
        set(name, value, options) {
          res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`)
        },
        remove(name, options) {
          res.setHeader(
            'Set-Cookie',
            `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
          )
        },
      },
    }
  )
} 