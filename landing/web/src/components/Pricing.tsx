import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { CheckoutModal } from "./CheckoutModal";

type Plan = {
  id: "FREE" | "PREMIUM" | "PRO";
  nameKey: string;
  priceKey: string;
  unitKey: string;
  features: string[];
  popular?: boolean;
};

const plans: Plan[] = [
  {
    id: "FREE",
    nameKey: "pricing.freeName",
    priceKey: "pricing.freePrice",
    unitKey: "pricing.freeUnit",
    features: ["pricing.freeF1", "pricing.freeF2", "pricing.freeF3"],
  },
  {
    id: "PREMIUM",
    nameKey: "pricing.premiumName",
    priceKey: "pricing.premiumPrice",
    unitKey: "pricing.premiumUnit",
    features: ["pricing.premiumF1", "pricing.premiumF2", "pricing.premiumF3"],
    popular: true,
  },
  {
    id: "PRO",
    nameKey: "pricing.proName",
    priceKey: "pricing.proPrice",
    unitKey: "pricing.proUnit",
    features: ["pricing.proF1", "pricing.proF2", "pricing.proF3"],
  },
];

export function Pricing() {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  return (
    <>
      <section id="pricing" className="bg-gray-50/60 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t("pricing.title")}
            </h2>
            <p className="mt-4 text-lg text-gray-500">{t("pricing.subtitle")}</p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-shadow hover:shadow-md",
                  plan.popular
                    ? "border-indigo-600 ring-1 ring-indigo-600"
                    : "border-gray-200"
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                    {t("pricing.popular")}
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{t(plan.nameKey)}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-gray-900">
                    {t(plan.priceKey)}
                  </span>
                  <span className="text-sm text-gray-500">{t(plan.unitKey)}</span>
                </div>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((fk) => (
                    <li key={fk} className="flex items-start gap-3 text-sm text-gray-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                      {t(fk)}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    "mt-8 w-full rounded-full py-2.5 text-sm font-semibold transition-colors",
                    plan.popular
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {t("pricing.cta")}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedPlan && (
        <CheckoutModal
          planId={selectedPlan.id}
          planName={t(selectedPlan.nameKey)}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </>
  );
}
