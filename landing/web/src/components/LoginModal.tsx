import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  onClose: () => void;
};

export function LoginModal({ onClose }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = useMemo(() => EMAIL_RE.test(email.trim()), [email]);

  async function handleSubmit() {
    if (!emailValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        if (res.status === 404) setError(t("login.notFound"));
        else setError(t("login.genericError"));
        return;
      }

      const data = (await res.json()) as { url?: string; redirectUrl?: string };
      const target = data.redirectUrl ?? data.url;
      if (!target) {
        setError(t("login.genericError"));
        return;
      }

      window.location.href = target;
    } catch {
      setError(t("login.genericError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">{t("login.title")}</h3>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t("login.emailLabel")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder={t("login.emailPlaceholder")}
              className={cn(
                "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400",
                email && !emailValid && "border-red-300 focus:border-red-400 focus:ring-red-400"
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            {email && !emailValid && (
              <p className="mt-1 text-xs text-red-500">{t("login.emailInvalid")}</p>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <button
            type="button"
            disabled={!emailValid || loading}
            onClick={handleSubmit}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-colors",
              emailValid && !loading
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "cursor-not-allowed bg-gray-100 text-gray-400"
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? t("login.loading") : t("login.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}

