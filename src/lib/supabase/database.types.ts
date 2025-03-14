export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          avatar_url: string | null
          email: string
          subscription_tier: 'free' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          company_name: string | null
          company_size: string | null
          industry: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          email: string
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          company_name?: string | null
          company_size?: string | null
          industry?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          email?: string
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          company_name?: string | null
          company_size?: string | null
          industry?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          url: string
          user_id: string
          status: 'active' | 'archived' | 'deleted'
          last_audit_date: string | null
          keywords: string[] | null
          competitors: string[] | null
          crawl_frequency: 'monthly' | 'weekly' | 'daily'
          crawl_depth: number
          industry: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          url: string
          user_id: string
          status?: 'active' | 'archived' | 'deleted'
          last_audit_date?: string | null
          keywords?: string[] | null
          competitors?: string[] | null
          crawl_frequency?: 'monthly' | 'weekly' | 'daily'
          crawl_depth?: number
          industry?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          url?: string
          user_id?: string
          status?: 'active' | 'archived' | 'deleted'
          last_audit_date?: string | null
          keywords?: string[] | null
          competitors?: string[] | null
          crawl_frequency?: 'monthly' | 'weekly' | 'daily'
          crawl_depth?: number
          industry?: string | null
        }
      }
      audits: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          project_id: string
          user_id: string
          url: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          score: number | null
          report: Json | null
          pdf_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          project_id: string
          user_id: string
          url: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          score?: number | null
          report?: Json | null
          pdf_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          project_id?: string
          user_id?: string
          url?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          score?: number | null
          report?: Json | null
          pdf_url?: string | null
        }
      }
      todos: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          project_id: string
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'canceled'
          priority: 'critical' | 'high' | 'medium' | 'low'
          due_date: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          project_id: string
          title: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'canceled'
          priority?: 'critical' | 'high' | 'medium' | 'low'
          due_date?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          project_id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'canceled'
          priority?: 'critical' | 'high' | 'medium' | 'low'
          due_date?: string | null
          completed_at?: string | null
        }
      }
      competitors: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          project_id: string
          user_id: string
          name: string
          url: string
          description: string | null
          keywords: string[] | null
          last_analysis_date: string | null
          analysis_data: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          project_id: string
          user_id: string
          name: string
          url: string
          description?: string | null
          keywords?: string[] | null
          last_analysis_date?: string | null
          analysis_data?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          project_id?: string
          user_id?: string
          name?: string
          url?: string
          description?: string | null
          keywords?: string[] | null
          last_analysis_date?: string | null
          analysis_data?: Json | null
        }
      }
      white_label_settings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          logo_url: string | null
          logo_alt: string | null
          primary_color: string | null
          secondary_color: string | null
          company_name: string | null
          custom_domain: string | null
          custom_css: string | null
          custom_js: string | null
          custom_copyright: string | null
          social_links: Json | null
          navigation: Json | null
          footer_navigation: Json | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          logo_url?: string | null
          logo_alt?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          company_name?: string | null
          custom_domain?: string | null
          custom_css?: string | null
          custom_js?: string | null
          custom_copyright?: string | null
          social_links?: Json | null
          navigation?: Json | null
          footer_navigation?: Json | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          logo_url?: string | null
          logo_alt?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          company_name?: string | null
          custom_domain?: string | null
          custom_css?: string | null
          custom_js?: string | null
          custom_copyright?: string | null
          social_links?: Json | null
          navigation?: Json | null
          footer_navigation?: Json | null
          is_active?: boolean
        }
      }
      project_templates: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          organization_id: string
          template_data: Json
          industry: string | null
          is_default: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          organization_id: string
          template_data: Json
          industry?: string | null
          is_default?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          organization_id?: string
          template_data?: Json
          industry?: string | null
          is_default?: boolean
        }
      }
      google_search_console_connections: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          project_id: string
          access_token: string
          refresh_token: string
          token_expiry: string
          site_url: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          project_id: string
          access_token: string
          refresh_token: string
          token_expiry: string
          site_url: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          project_id?: string
          access_token?: string
          refresh_token?: string
          token_expiry?: string
          site_url?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 