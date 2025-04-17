"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
})

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<string>("Checking session...")
  
  // Check session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()
        console.log("Initial session check:", { data, error })
        setSessionStatus(data.session ? `Session exists for ${data.session.user.email}` : "No session found")
      } catch (error) {
        console.error("Error checking session:", error)
        setSessionStatus("Error checking session")
      }
    }
    
    checkSession()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Form submitted with values:", values);
    setIsLoading(true)
    
    try {
      console.log("Creating Supabase client...");
      const supabase = createClient()
      console.log("Supabase client created successfully");
      
      console.log("Attempting to sign in...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })
      console.log("Sign in response:", { data, error });
      
      if (error) {
        console.error("Login error:", error.message);
        toast.error(error.message)
        return
      }
      
      // Check if we have a session after login
      const { data: sessionData } = await supabase.auth.getSession()
      console.log("Session after login:", sessionData)
      
      if (!sessionData.session) {
        console.error("No session created after successful login")
        toast.error("Authentication succeeded but no session was created. Please try again.")
        return
      }
      
      // Check if user exists in the users table
      const userId = sessionData.session.user.id;
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();
        
      if (userError) {
        console.log("User not found in users table, creating record...");
        
        // Get user metadata from auth
        const { data: userMetadata } = await supabase.auth.getUser();
        const metadata = userMetadata?.user?.user_metadata || {};
        
        // Create user record
        const { error: createUserError } = await supabase
          .from("users")
          .insert({
            id: userId,
            email: values.email,
            full_name: metadata.full_name || "",
            company_name: metadata.company_name || null,
            subscription_level: "free",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (createUserError) {
          console.error("Error creating user record:", createUserError);
          toast.error("Login successful but profile setup failed. Some features may be limited.");
        } else {
          console.log("User record created successfully");
        }
        
        // Also check if profile exists
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .single();
          
        if (profileError) {
          console.log("Profile not found, creating profile record...");
          
          // Create profile record
          const { error: createProfileError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              email: values.email,
              full_name: metadata.full_name || "",
              company_name: metadata.company_name || null,
              subscription_tier: "free",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            
          if (createProfileError) {
            console.error("Error creating profile record:", createProfileError);
          } else {
            console.log("Profile record created successfully");
          }
        }
      } else {
        console.log("User found in users table:", userData);
      }
      
      console.log("Login successful, redirecting to dashboard...");
      toast.success("Login successful!")
      
      // Set a custom cookie to verify cookie functionality
      document.cookie = "login_test=true; path=/; max-age=3600;"
      console.log("Test cookie set, all cookies:", document.cookie)
      
      // Force a hard navigation to the dashboard
      window.location.href = "/dashboard"
    } catch (error) {
      console.error("Unexpected error during login:", error);
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-md gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-balance text-muted-foreground">
          Enter your email below to login to your account
        </p>
        <p className="text-xs text-muted-foreground">{sessionStatus}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Form>
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </div>
    </div>
  )
} 