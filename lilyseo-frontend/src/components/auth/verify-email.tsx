"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function VerifyEmail() {
  const router = useRouter()

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Check Your Email</CardTitle>
        <CardDescription>
          We've sent you a verification link to your email address.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="p-4 bg-muted rounded-md">
          <p className="mb-4">
            Please check your email inbox and click the verification link to complete your registration.
          </p>
          <p className="text-sm text-muted-foreground">
            If you don't see the email, check your spam folder or try again.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-muted-foreground">
          Already verified?{" "}
          <Button variant="link" className="p-0" onClick={() => router.push("/auth/login")}>
            Sign in
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
} 