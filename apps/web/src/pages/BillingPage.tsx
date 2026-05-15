import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, CheckCircle2, ArrowRight, Infinity as InfinityIcon, Monitor, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

const STRIPE_PREMIUM_LINK = "https://buy.stripe.com/eVq9ATamnfJN8VP3WEbsc02";
const STRIPE_PRO_LINK = "https://buy.stripe.com/4gM6oH3XZcxB6NHgJqbsc03";

// Slug = first subdomain label, used as client_reference_id for Stripe webhook matching.
const INSTANCE_SLUG = window.location.hostname.split(".")[0] || "default";

type PlanId = "FREE" | "PREMIUM" | "PRO";

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
};

const PLAN_BADGE_CLASS: Record<PlanId, string> = {
  FREE: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  PREMIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  PRO: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

function usageColor(used: number, limit: number): string {
  if (limit === Infinity) return "bg-emerald-500";
  const ratio = used / limit;
  if (ratio >= 0.9) return "bg-red-500";
  if (ratio >= 0.7) return "bg-amber-500";
  return "bg-emerald-500";
}

function usageTextColor(used: number, limit: number): string {
  if (limit === Infinity) return "";
  const ratio = used / limit;
  if (ratio >= 0.9) return "text-red-600 dark:text-red-400";
  if (ratio >= 0.7) return "text-amber-600 dark:text-amber-400";
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
          <div className="h-full w-full bg-emerald-500/30 flex items-center justify-center">
            <div className="h-full w-8 bg-emerald-500 rounded-full" />
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

  useEffect(() => {
    apiFetch<PlanInfo>("/api/instance/plan")
      .then(setPlan)
      .catch(() => {});
  }, []);

  const planId = plan?.planId ?? "FREE";
  const limits = plan?.limits;
  const usage = plan?.usage;

  const screensAtLimit = limits && usage ? isNearLimit(usage.screens, limits.screens) : false;
  const usersAtLimit = limits && usage ? isNearLimit(usage.users, limits.users) : false;

  return (
    <div className="space-y-6">
      {/* Plan actuel */}
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <CreditCard className="size-5 text-blue-700 dark:text-blue-400" />
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
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              {t("billing.active")}
            </span>
          </div>
        </div>
      </div>

      {/* Usage */}
      {limits && usage && (
        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
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
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
              {t("billing.usageNearLimit")}
            </p>
          )}
        </div>
      )}

      {/* CTA upgrade */}
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("billing.paymentSection")}
        </h3>
        {planId === "PRO" ? (
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
    </div>
  );
}
