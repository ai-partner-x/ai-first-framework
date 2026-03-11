import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { useLogin } from "@scaffold/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { mutate: login } = useLogin()
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const result = await login({ account, password })
      if (result.success) {
        const to =
          searchParams.get("to") != null
            ? decodeURIComponent(searchParams.get("to")!)
            : result.redirectTo ?? "/"
        navigate(to, { replace: true })
      } else if (result.error) {
        setError(result.error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center",
        "bg-background p-4"
      )}
    >
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("auth.loginTitle")}
          </h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account">{t("auth.email")}</Label>
            <Input
              id="account"
              type="text"
              placeholder="admin@example.com"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              required
              autoComplete="username"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "..." : t("auth.submit")}
          </Button>
        </form>
      </div>
    </div>
  )
}
