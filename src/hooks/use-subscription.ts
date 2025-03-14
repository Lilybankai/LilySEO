"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Subscription {
  tier: 'free' | 'pro' | 'enterprise'
  project_limit: number | null
  project_count: number
  keyword_limit: number | null
  keyword_count: number
  competitor_limit: number | null
  competitor_count: number
  is_active: boolean
  expires_at: string | null
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const supabase = createClient()
  
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setIsLoading(true)
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setSubscription(null)
          return
        }
        
        // Get the user's subscription data
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (error) {
          throw error
        }
        
        // Get the user's project count
        const { count: projectCount, error: projectError } = await supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
        
        if (projectError) {
          throw projectError
        }
        
        // Get the user's keyword count (sum of all keywords across projects)
        const { data: projects, error: keywordError } = await supabase
          .from('projects')
          .select('keywords, competitors')
          .eq('user_id', user.id)
        
        if (keywordError) {
          throw keywordError
        }
        
        const keywordCount = projects.reduce((total, project) => {
          return total + (project.keywords?.length || 0)
        }, 0)
        
        // Get the user's competitor count (sum of all competitors across projects)
        const competitorCount = projects.reduce((total, project) => {
          return total + (project.competitors?.length || 0)
        }, 0)
        
        // If no subscription found, create a default free tier
        if (!data) {
          setSubscription({
            tier: 'free',
            project_limit: 1,
            project_count: projectCount || 0,
            keyword_limit: 100,
            keyword_count: keywordCount,
            competitor_limit: 5,
            competitor_count: competitorCount,
            is_active: true,
            expires_at: null,
          })
          return
        }
        
        // Set the subscription with usage data
        setSubscription({
          ...data,
          project_count: projectCount || 0,
          keyword_count: keywordCount,
          competitor_count: competitorCount,
        })
      } catch (err) {
        console.error('Error fetching subscription:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSubscription()
    
    // Set up a subscription to listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription()
    })
    
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])
  
  return { subscription, isLoading, error }
} 