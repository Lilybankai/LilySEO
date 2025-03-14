import { Metadata } from "next"
import { SignUpForm } from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Sign Up | LilySEO",
  description: "Create a new LilySEO account",
}

export default function SignUpPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your details to create a new account
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
} 