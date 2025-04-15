import { Metadata } from "next"
import { VerifyEmail } from "@/components/auth/verify-email"

export const metadata: Metadata = {
  title: "Verify Email | LilySEO",
  description: "Verify your email address for your LilySEO account",
}

export default function VerifyEmailPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Email Verification
          </h1>
          <p className="text-sm text-muted-foreground">
            Please verify your email address to continue
          </p>
        </div>
        <VerifyEmail />
      </div>
    </div>
  )
} 