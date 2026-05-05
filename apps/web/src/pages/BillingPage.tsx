import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, CheckCircle2, ArrowRight, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

const STRIPE_PREMIUM_LINK = "https://buy.stripe.com/4gM3cvcuv0OT3Bval2bsc00";
const STRIPE_PRO_LINK = "https://buy.stripe.com/9B600j0LN2X16NH50Ibsc01";

type PlanId = "FREE" | "PREMIUM" | "PRO";

interface PlanLimits {
  screens: number;
  mediaPerScreen: number;
  users: number;
}

interface PlanInfo {
  planId: PlanId;
  limits: PlanLimits;
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

function LimitValue({ value }: { value: number }) {
  const { t } = useTranslation();
  if (value === Infinity) {
    return (
      <span className="flex items-center gap-1 font-medium">
        <InfinityIcon className="size-3.5" />
        {t("billing.unlimited")}
      </span>
    );
  }
  return <span className="font-medium">{value}</span>;
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

  return (
    <div className="space-y-6">
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

      {limits && (
        <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("billing.quotasSection")}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("billing.screensLimit")}</span>
              <LimitValue value={limits.screens} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("billing.mediaLimit")}</span>
              <LimitValue value={limits.mediaPerScreen} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("billing.usersLimit")}</span>
              <LimitValue value={limits.users} />
            </div>
          </div>
        </div>
      )}

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
                variant="outline"
                className="gap-2 w-fit"
                onClick={() => window.open(STRIPE_PREMIUM_LINK, "_blank")}
              >
                {t("billing.upgradeToPremium")}
                <ArrowRight className="size-4" />
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-2 w-fit"
              onClick={() => window.open(STRIPE_PRO_LINK, "_blank")}
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
