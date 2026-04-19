import { useTranslation } from "react-i18next";
import { CreditCard, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BillingPage() {
  const { t } = useTranslation();

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
            <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {t("billing.planLabel")}
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

      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("billing.paymentSection")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("billing.paymentDesc")}</p>
        <Button variant="outline" className="gap-2" disabled>
          {t("billing.setupPayment")}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
