import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, CheckCircle2, ArrowRight, Infinity as InfinityIcon, Monitor, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiFetch } from "@/lib/api";

type SubscriptionInfo = {
  stripe: boolean;
  currentPeriodEnd?: number | null;
  cancelAtPeriodEnd?: boolean;
};

function formatDate(unixSeconds: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
    new Date(unixSeconds * 1000)
  );
}

const STRIPE_PREMIUM_LINK = "https://buy.stripe.com/eVq9ATamnfJN8VP3WEbsc02";
const STRIPE_PRO_LINK = "https://buy.stripe.com/4gM6oH3XZcxB6NHgJqbsc03";

// Slug = first subdomain label, used as client_reference_id for Stripe webhook matching.
const INSTANCE_SLUG = window.location.hostname.split(".")[0] || "default";

type PlanId = "FREE" | "PREMIUM" | "PRO" | "ENTERPRISE";

interface PlanLimits {
  screens: number | null;
  users: number | null;
}

// JSON.stringify(Infinity) === null — treat a null limit as unlimited.
function normalizeLimit(v: number | null | undefined): number {
  return v == null ? Infinity : v;
}

interface PlanUsage {
  screens: number;
  users: number;
}

interface PlanInfo {
  planId: PlanId;
  limits: PlanLimits;
  usage: PlanUsage;
}

const PLAN_LABEL_KEY: Record<PlanId, string> = {
  FREE: "billing.planFree",
  PREMIUM: "billing.planPremium",
  PRO: "billing.planPro",
  ENTERPRISE: "billing.planEnterprise",
};

const PLAN_BADGE_CLASS: Record<PlanId, string> = {
  FREE: "bg-tier-free text-tier-free-foreground",
  PREMIUM: "bg-tier-premium text-tier-premium-foreground",
  PRO: "bg-tier-pro text-tier-pro-foreground",
  ENTERPRISE: "bg-tier-enterprise text-tier-enterprise-foreground",
};

function usageColor(used: number, limit: number): string {
  if (limit === Infinity) return "bg-success";
  const ratio = used / limit;
  if (ratio >= 0.9) return "bg-destructive";
  if (ratio >= 0.7) return "bg-warning";
  return "bg-success";
}

function usageTextColor(used: number, limit: number): string {
  if (limit === Infinity) return "";
  const ratio = used / limit;
  if (ratio >= 0.9) return "text-destructive";
  if (ratio >= 0.7) return "text-warning";
  return "";
}

function isNearLimit(used: number, limit: number): boolean {
  if (limit === Infinity) return false;
  return used / limit >= 0.9;
}

interface UsageBarProps {
  icon: React.ReactNode;
  label: string;
  used: number;
  limit: number;
  formatLabel: (used: number, limit: number) => React.ReactNode;
}

function UsageBar({ icon, label, used, limit, formatLabel }: UsageBarProps) {
  const barColor = usageColor(used, limit);
  const textColor = usageTextColor(used, limit);
  const pct = limit === Infinity ? 100 : Math.min(100, (used / limit) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className={`font-medium ${textColor}`}>{formatLabel(used, limit)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        {limit === Infinity ? (
          <div className="h-full w-full bg-success/30 flex items-center justify-center">
            <div className="h-full w-8 bg-success rounded-full" />
          </div>
        ) : (
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}

export function BillingPage() {
  const { t, i18n } = useTranslation();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<
    | null
    | { kind: "scheduled"; date: string }
    | { kind: "immediate" }
    | { kind: "error" }
  >(null);

  useEffect(() => {
    apiFetch<PlanInfo>("/api/instance/plan")
      .then(setPlan)
      .catch(() => {});
  }, []);

  async function openCancelDialog() {
    setBusy(true);
    setResult(null);
    try {
      const info = await apiFetch<SubscriptionInfo>("/api/instance/subscription");
      setSubInfo(info);
    } catch {
      setSubInfo({ stripe: false });
    } finally {
      setBusy(false);
      setDlgOpen(true);
    }
  }

  async function confirmCancel() {
    setBusy(true);
    try {
      const res = await apiFetch<{ mode?: string; currentPeriodEnd?: number | null }>(
        "/api/instance/cancel-subscription",
        { method: "POST" }
      );
      setDlgOpen(false);
      if (res.mode === "period_end" && res.currentPeriodEnd) {
        setResult({ kind: "scheduled", date: formatDate(res.currentPeriodEnd, i18n.language) });
      } else {
        setResult({ kind: "immediate" });
        setPlan((prev) => (prev ? { ...prev, planId: "FREE" } : prev));
      }
    } catch {
      setDlgOpen(false);
      setResult({ kind: "error" });
    } finally {
      setBusy(false);
    }
  }

  const periodEndDate =
    subInfo?.stripe && subInfo.currentPeriodEnd
      ? formatDate(subInfo.currentPeriodEnd, i18n.language)
      : null;

  const planId = plan?.planId ?? "FREE";
  const limits = plan?.limits;
  const usage = plan?.usage;

  const screensLimit = normalizeLimit(limits?.screens);
  const usersLimit = normalizeLimit(limits?.users);
  // The account/users tracker is only meaningful on FREE (capped at 1);
  // paid plans are unlimited, so the bar is hidden.
  const showUsersBar = Number.isFinite(usersLimit);

  const screensAtLimit = limits && usage ? isNearLimit(usage.screens, screensLimit) : false;
  const usersAtLimit = limits && usage && showUsersBar ? isNearLimit(usage.users, usersLimit) : false;

  return (
    <div>
      {/* Plan actuel */}
      <div className="py-4 border-b border-border/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">{t("billing.title")}</h2>
              <p className="text-xs text-muted-foreground">{t("billing.subtitle")}</p>
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">{t("billing.currentPlan")}</span>
              <span className={`rounded px-2.5 py-0.5 text-xs font-semibold ${PLAN_BADGE_CLASS[planId]}`}>
                {t(PLAN_LABEL_KEY[planId])}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">{t("billing.status")}</span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                <CheckCircle2 className="size-3.5" />
                {t("billing.active")}
              </span>
            </div>
          </div>
        </div>

      {/* Usage */}
      {limits && usage && (
        <div className="py-4 border-b border-border/60 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("billing.usageSection")}
            </h3>
            <div className="space-y-4">
              <UsageBar
                icon={<Monitor className="size-3.5" />}
                label={t("billing.screensLimit")}
                used={usage.screens}
                limit={screensLimit}
                formatLabel={(used, limit) =>
                  limit === Infinity ? (
                    <span className="flex items-center gap-1">
                      {used} / <InfinityIcon className="size-3.5" />
                    </span>
                  ) : (
                    `${used} / ${limit}`
                  )
                }
              />
              {showUsersBar && (
                <UsageBar
                  icon={<Users className="size-3.5" />}
                  label={t("billing.usersLimit")}
                  used={usage.users}
                  limit={usersLimit}
                  formatLabel={(used, limit) =>
                    limit === Infinity ? (
                      <span className="flex items-center gap-1">
                        {used} / <InfinityIcon className="size-3.5" />
                      </span>
                    ) : (
                      `${used} / ${limit}`
                    )
                  }
                />
              )}
            </div>
            {(screensAtLimit || usersAtLimit) && (
              <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">
                {t("billing.usageNearLimit")}
              </p>
            )}
          </div>
        )}

      {/* CTA upgrade */}
      <div className="py-4 border-b border-border/60 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("billing.paymentSection")}
          </h3>
          {planId === "ENTERPRISE" ? (
            <p className="text-sm text-muted-foreground">{t("billing.topPlan")}</p>
          ) : planId === "PRO" ? (
            <a
              href="mailto:support@canope.org"
              className="inline-flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("billing.enterpriseContact")}
              <ArrowRight className="size-3.5" />
            </a>
          ) : (
            <div className="flex flex-wrap gap-2">
              {planId === "FREE" && (
                <Button
                  size="sm"
                  className="gap-2 h-8"
                  onClick={() => window.open(`${STRIPE_PREMIUM_LINK}?client_reference_id=${INSTANCE_SLUG}`, "_blank")}
                >
                  {t("billing.upgradeToPremium")}
                  <ArrowRight className="size-3.5" />
                </Button>
              )}
              <Button
                variant={planId === "PREMIUM" ? "default" : "outline"}
                size="sm"
                className="gap-2 h-8"
                onClick={() => window.open(`${STRIPE_PRO_LINK}?client_reference_id=${INSTANCE_SLUG}`, "_blank")}
              >
                {t("billing.upgradeToPro")}
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

      {/* Cancel subscription — only shown for paid plans */}
      {(planId === "PREMIUM" || planId === "PRO") && (
        <div className="py-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("billing.cancelSubscription")}
            </h3>

            {result?.kind === "scheduled" && (
              <p className="text-sm text-success">
                {t("billing.cancelScheduled", { date: result.date })}
              </p>
            )}
            {result?.kind === "immediate" && (
              <p className="text-sm text-success">{t("billing.cancelSuccess")}</p>
            )}
            {result?.kind === "error" && (
              <p className="text-sm text-destructive">{t("billing.cancelError")}</p>
            )}

            {result?.kind !== "scheduled" && result?.kind !== "immediate" && (
              <Button
                variant="destructive"
                size="sm"
                className="h-8"
                disabled={busy}
                onClick={openCancelDialog}
              >
                {busy ? t("billing.cancelling") : t("billing.cancelSubscription")}
              </Button>
            )}

            <AlertDialog open={dlgOpen} onOpenChange={setDlgOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-destructive/10 text-destructive">
                    <AlertTriangle />
                  </AlertDialogMedia>
                  <AlertDialogTitle>{t("billing.cancelTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {periodEndDate
                      ? t("billing.cancelExplainPeriodEnd", { date: periodEndDate })
                      : t("billing.cancelExplainImmediate")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <p className="text-xs text-muted-foreground">
                  {t("billing.cancelScreensNote")}
                </p>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={busy}>
                    {t("billing.cancelAbort")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={busy}
                    onClick={confirmCancel}
                  >
                    {busy ? t("billing.cancelling") : t("billing.cancelConfirmCta")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
    </div>
  );
}
