import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import logoSrc from "@/assets/LogoTemporaire.png";

export function LoginPage() {
  const { t } = useTranslation();
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!loading && user) {
    const to = (location.state as { from?: string } | null)?.from ?? "/app/dashboard";
    return <Navigate to={to} replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(username, password);
    } catch {
      setError(t("login.error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <Card className="border-border/80 w-full max-w-md rounded-lg shadow-md">
        <CardContent className="p-8 pt-8">
          <div className="mb-6 flex items-center gap-3">
            <img src={logoSrc} alt={t("app.name")} className="h-10 w-auto" />
            <h1 className="text-foreground text-2xl font-bold">
              {t("login.title")}
              <span className="text-primary"> {t("app.name")}</span>
            </h1>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium">
                {t("login.username")}
              </Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 rounded-lg bg-background"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                {t("login.password")}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-lg bg-background pr-10"
                  required
                />
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2 rounded p-1"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                >
                  {showPassword ? (
                    <svg className="size-5" fill="none" viewBox="0 0 64 64" stroke="currentColor" aria-hidden>
                      <path
                        strokeWidth={6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M32 16C20 16 10.2 25 6 32c4.2 7 14 16 26 16s21.8-9 26-16c-4.2-7-14-16-26-16Z"
                      />
                      <circle cx="32" cy="32" r="8" strokeWidth={6} fill="none" />
                    </svg>
                  ) : (
                    <svg className="size-5" fill="none" viewBox="0 0 64 64" stroke="currentColor" aria-hidden>
                      <g transform="scale(1 -1) translate(0 -64)">
                        <path
                          d="M8 32C20 16 44 16 56 32"
                          strokeWidth={6}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <line x1="14" y1="24" x2="10" y2="22" strokeWidth={6} strokeLinecap="round" />
                        <line x1="22" y1="20" x2="18" y2="18" strokeWidth={6} strokeLinecap="round" />
                        <line x1="32" y1="18" x2="32" y2="16" strokeWidth={6} strokeLinecap="round" />
                        <line x1="42" y1="20" x2="46" y2="18" strokeWidth={6} strokeLinecap="round" />
                        <line x1="50" y1="24" x2="54" y2="22" strokeWidth={6} strokeLinecap="round" />
                      </g>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-sm">{error}</p>
            )}
            <Button
              type="submit"
              className="mt-2 h-10 w-full rounded-lg font-medium"
              disabled={pending}
            >
              {t("login.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
