"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { InputPassword } from "@/components/admin-ui/form/input-password"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router"
import { appAuth } from "@scaffold/core"

export const SignInForm = () => {
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSignIn: React.ComponentProps<"form">["onSubmit"] = async (e) => {
    e.preventDefault()
    setError(null)
    const result = await appAuth.login({ account, password })
    if (result.success) {
      navigate(result.redirectTo ?? "/", { replace: true })
    } else {
      setError(result.error?.message ?? "Login failed")
    }
  }

  return (
    <div
      className={cn(
        "flex",
        "flex-col",
        "items-center",
        "justify-center",
        "px-6",
        "py-8",
        "min-h-svh"
      )}
    >
      <Card className={cn("sm:w-[456px]", "p-12", "mt-6")}>
        <CardHeader className={cn("px-0")}>
          <CardTitle
            className={cn(
              "text-blue-600",
              "dark:text-blue-400",
              "text-3xl",
              "font-semibold"
            )}
          >
            Sign in
          </CardTitle>
          <CardDescription
            className={cn("text-muted-foreground", "font-medium")}
          >
            Welcome back
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className={cn("px-0")}>
          <form onSubmit={handleSignIn}>
            <div className={cn("flex", "flex-col", "gap-2")}>
              <Label htmlFor="account">Account</Label>
              <Input
                id="account"
                placeholder=""
                required
                value={account}
                onChange={(e) => setAccount(e.target.value)}
              />
            </div>
            <div
              className={cn("relative", "flex", "flex-col", "gap-2", "mt-6")}
            >
              <Label htmlFor="password">Password</Label>
              <InputPassword
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error ? (
              <p
                role="alert"
                className={cn(
                  "mt-4", "text-sm", "text-destructive", "font-medium"
                )}
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" className={cn("w-full", "mt-6")}>
              Sign in
            </Button>



          </form>
        </CardContent>
      </Card>
    </div>
  )
}

SignInForm.displayName = "SignInForm"
