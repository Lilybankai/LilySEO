"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  companyName: z.string().optional(),
})

export function SignUpForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      companyName: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            company_name: values.companyName || null,
          },
        },
      })
      
      if (error) {
        throw error
      }
      
      if (data.user) {
        console.log("User created successfully:", data.user.id);
        
        // Manually insert the user into the users table
        const { error: usersError } = await supabase
          .from("users")
          .insert({
            id: data.user.id,
            email: values.email,
            full_name: values.fullName,
            company_name: values.companyName || null,
            subscription_level: "free",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (usersError) {
          console.error("Error creating user record:", usersError);
          toast.error("Account created but profile setup failed. Please contact support.");
        } else {
          console.log("User record created successfully");
          toast.success("Account created successfully!");
        }
        
        // Also ensure the profile is created
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email: values.email,
            full_name: values.fullName,
            company_name: values.companyName || null,
            subscription_tier: "free",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (profileError) {
          console.error("Error creating profile record:", profileError);
          toast.error("Account created but profile setup failed. Please contact support.");
        } else {
          console.log("Profile record created successfully");
        }
      }
      
      router.push('/auth/verify-email')
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "An error occurred during sign up.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Sign up for LilySEO to start improving your website's SEO.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <div className="text-sm font-medium text-destructive">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Button variant="link" className="p-0" onClick={() => router.push("/auth/login")}>
            Sign in
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
} 