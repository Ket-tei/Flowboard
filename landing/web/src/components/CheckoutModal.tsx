import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN = import.meta.env.VITE_INSTANCE_BASE_HOST ?? "localhost";

type ProvisioningPhase = "idle" | "validating" | "deploying" | "ready" | "failed";

type Props = {
  planId: "FREE" | "PREMIUM" | "PRO";
  planName: string;
  onClose: () => void;
};

export function CheckoutModal({ planId, planName, onClose }: Props) {
  const { t } = useTranslation();

  const [slug, setSlug] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");

  const [phase, setPhase] = useState<ProvisioningPhase>("idle");
  const [successUrl, setSuccessUrl] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    slug?: string;
    email?: string;
    password?: string;
  }>({});

  const slugValid = SLUG_RE.test(slug);
  const adminEmailValid = EMAIL_RE.test(adminEmail);
  const canSubmit = slugValid && adminEmailValid && adminPass.length >= 6;
  const loading = phase === "validating" || phase === "deploying";

  async function handleSubmit() {
    if (!canSubmit || loading) return;
    setPhase("validating");
    setFormError(null);
    setFieldErrors({});

    try {
      setPhase("deploying");

      const res = await fetch("/api/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          email: adminEmail,
          password: adminPass,
          planId,
        }),
      });

      const data = (await res.json()) as {
        url?: string;
        redirectUrl?: string;
        status?: string;
        message?: string;
        fieldErrors?: { slug?: string; email?: string; password?: string };
      };

      if (!res.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
          setPhase("idle");
        } else {
          setFormError(data.message ?? t("checkout.genericError"));
          setPhase("failed");
        }
        return;
      }

      setInstanceUrl(data.url ?? `http://${slug}.${DOMAIN}`);
      setSuccessUrl(data.redirectUrl ?? data.url ?? `http://${slug}.${DOMAIN}`);
      setPhase("ready");
    } catch {
      setFormError(t("checkout.genericError"));
      setPhase("failed");
    }
  }

  function handleRetry() {
    setPhase("idle");
    setFormError(null);
  }

  const subdomain = `${slug}.${DOMAIN}`;

  if (phase === "deploying") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
          <div className="space-y-6 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-500" />
            <h3 className="text-xl font-bold text-gray-900">{t("checkout.deploying")}</h3>
            <p className="text-gray-500">{t("checkout.deployingDesc")}</p>
            <div className="space-y-2">
              <ProgressStep label={t("checkout.stepValidation")} done />
              <ProgressStep label={t("checkout.stepDocker")} active />
              <ProgressStep label={t("checkout.stepReady")} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "ready") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="space-y-5 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h3 className="text-xl font-bold text-gray-900">{t("checkout.successTitle")}</h3>
            <p className="text-gray-500">{t("checkout.successDesc")}</p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-500">{t("checkout.yourUrl")}</p>
              <p className="mt-1 font-mono text-sm font-semibold text-indigo-600">
                {instanceUrl || `http://${subdomain}`}
              </p>
            </div>
            <div className="space-y-2">
              <ProgressStep label={t("checkout.stepValidation")} done />
              <ProgressStep label={t("checkout.stepDocker")} done />
              <ProgressStep label={t("checkout.stepReady")} done />
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.href = successUrl;
              }}
              className="w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              {t("checkout.goToInstance")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="space-y-5 text-center">
            <AlertCircle className="mx-auto h-14 w-14 text-red-500" />
            <h3 className="text-xl font-bold text-gray-900">{t("checkout.failedTitle")}</h3>
            <p className="text-gray-500">{formError ?? t("checkout.genericError")}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="w-full rounded-full bg-gray-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              {t("checkout.retry")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900">{t("checkout.title")}</h3>

          <div className="rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700">
            {t("checkout.plan")} : {planName} ({planId})
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t("checkout.instanceName")}
              </label>
              <div className="flex items-center gap-0">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder={t("checkout.instancePlaceholder")}
                  className={cn(
                    "flex-1 rounded-l-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400",
                    slug && !slugValid && "border-red-300 focus:border-red-400 focus:ring-red-400"
                  )}
                />
                <span className="rounded-r-lg border border-l-0 border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  .{DOMAIN}
                </span>
              </div>
              {slug && !slugValid && (
                <p className="mt-1 text-xs text-red-500">{t("checkout.slugInvalid")}</p>
              )}
              {fieldErrors.slug === "taken" && (
                <p className="mt-1 text-xs text-red-500">{t("checkout.slugTaken")}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t("checkout.adminUsername")}
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                className={cn(
                  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400",
                  (adminEmail && !adminEmailValid) || fieldErrors.email
                    ? "border-red-300 focus:border-red-400 focus:ring-red-400"
                    : ""
                )}
              />
              {adminEmail && !adminEmailValid && (
                <p className="mt-1 text-xs text-red-500">{t("checkout.emailInvalid")}</p>
              )}
              {fieldErrors.email === "taken" && (
                <p className="mt-1 text-xs text-red-500">{t("checkout.emailTaken")}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t("checkout.adminPassword")}
              </label>
              <input
                type="password"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className={cn(
                  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400",
                  (adminPass && adminPass.length < 6) || fieldErrors.password
                    ? "border-red-300 focus:border-red-400 focus:ring-red-400"
                    : ""
                )}
              />
              {adminPass && adminPass.length < 6 && (
                <p className="mt-1 text-xs text-red-500">{t("checkout.passwordTooShort")}</p>
              )}
            </div>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="button"
            disabled={!canSubmit || loading}
            onClick={handleSubmit}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-colors",
              canSubmit && !loading
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "cursor-not-allowed bg-gray-100 text-gray-400"
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? t("checkout.creating") : t("checkout.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressStep({
  label,
  done,
  active,
}: {
  label: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {done ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : active ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-500" />
      ) : (
        <div className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-200" />
      )}
      <span className={cn("text-left", done ? "text-gray-700" : active ? "text-gray-700 font-medium" : "text-gray-400")}>
        {label}
      </span>
    </div>
  );
}
