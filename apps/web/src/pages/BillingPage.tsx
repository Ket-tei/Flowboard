import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, CheckCircle2, ArrowRight, Infinity as InfinityIcon, Monitor, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

const STRIPE_PREMIUM_LINK = "https://buy.stripe.com/eVq9ATamnfJN8VP3WEbsc02";
const STRIPE_PRO_LINK = "https://buy.stripe.com/4gM6oH3XZcxB6NHgJqbsc03";

// Slug = first subdomain label, used as client_reference_id for Stripe webhook matching.
const INSTANCE_SLUG = window.location.hostname.split(".")[0] || "default";

type PlanId = "FREE" | "PREMIUM" | "PRO" | "ENTERPRISE";

interface PlanLimits {
  screens: number;
  users: number;
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
  const { t } = useTranslation();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [cancelState, setCancelState] = useState<"idle" | "confirm" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    apiFetch<PlanInfo>("/api/instance/plan")
      .then(setPlan)
      .catch(() => {});
  }, []);

  async function handleCancelSubscription() {
    if (cancelState === "confirm") {
      setCancelState("loading");
      try {
        await apiFetch("/api/instance/cancel-subscription", { method: "POST" });
        setCancelState("success");
        setPlan((prev) => prev ? { ...prev, planId: "FREE" } : prev);
      } catch {
        setCancelState("error");
      }
    } else {
      setCancelState("confirm");
    }
  }

  const planId = plan?.planId ?? "FREE";
  const limits = plan?.limits;
  const usage = plan?.usage;

  const screensAtLimit = limits && usage ? isNearLimit(usage.screens, limits.screens) : false;
  const usersAtLimit = limits && usage ? isNearLimit(usage.users, limits.users) : false;

  return (
    <div className="space-y-6">
      {/* Plan actuel */}
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <CreditCard className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("billing.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("billing.subtitle")}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t("billing.currentPlan")}</span>
            <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${PLAN_BADGE_CLASS[planId]}`}>
              {t(PLAN_LABEL_KEY[planId])}
            </span>
          </div>
          <div className="flex items-center justify-between">
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
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("billing.usageSection")}
          </h3>
          <div className="space-y-4">
            <UsageBar
              icon={<Monitor className="size-3.5" />}
              label={t("billing.screensLimit")}
              used={usage.screens}
              limit={limits.screens}
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
            <UsageBar
              icon={<Users className="size-3.5" />}
              label={t("billing.usersLimit")}
              used={usage.users}
              limit={limits.users}
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
          </div>
          {(screensAtLimit || usersAtLimit) && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {t("billing.usageNearLimit")}
            </p>
          )}
        </div>
      )}

      {/* CTA upgrade */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("billing.paymentSection")}
        </h3>
        {planId === "PRO" || planId === "ENTERPRISE" ? (
          <p className="text-sm text-muted-foreground">{t("billing.topPlan")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {planId === "FREE" && (
              <Button
                className="gap-2 w-fit"
                onClick={() => window.open(`${STRIPE_PREMIUM_LINK}?client_reference_id=${INSTANCE_SLUG}`, "_blank")}
              >
                {t("billing.upgradeToPremium")}
                <ArrowRight className="size-4" />
              </Button>
            )}
            <Button
              variant={planId === "PREMIUM" ? "default" : "outline"}
              className="gap-2 w-fit"
              onClick={() => window.open(`${STRIPE_PRO_LINK}?client_reference_id=${INSTANCE_SLUG}`, "_blank")}
            >
              {t("billing.upgradeToPro")}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Cancel subscription — only shown for paid plans */}
      {(planId === "PREMIUM" || planId === "PRO") && (
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("billing.cancelSubscription")}
          </h3>

          {cancelState === "success" && (
            <p className="text-sm text-success">
              {t("billing.cancelSuccess")}
            </p>
          )}
          {cancelState === "error" && (
            <p className="text-sm text-destructive">
              {t("billing.cancelError")}
            </p>
          )}
          {cancelState !== "success" && (
            <>
              {cancelState === "confirm" && (
                <p className="text-sm text-warning-foreground bg-warning/15 rounded-lg px-3 py-2 flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  {t("billing.cancelConfirm")}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-fit"
                  disabled={cancelState === "loading"}
                  onClick={handleCancelSubscription}
                >
                  {cancelState === "loading"
                    ? t("billing.cancelling")
                    : cancelState === "confirm"
                    ? t("billing.cancelSubscription")
                    : t("billing.cancelSubscription")}
                </Button>
                {cancelState === "confirm" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelState("idle")}
                  >
                    {t("billing.cancelAbort")}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
