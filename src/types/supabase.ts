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
      todos: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          status: string
          priority: string
          project_id: string | null
          user_id: string
          audit_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          project_id?: string | null
          user_id: string
          audit_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          project_id?: string | null
          user_id?: string
          audit_id?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          url: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string
          user_id?: string
          created_at?: string
        }
      }
    }
  }
} 