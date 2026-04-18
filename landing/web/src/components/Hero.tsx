import { useTranslation } from "react-i18next";
import { Zap, Shield, Globe } from "lucide-react";

export function Hero() {
  const { t } = useTranslation();

  const features = [
    { icon: Zap, label: t("hero.feat1") },
    { icon: Shield, label: t("hero.feat2") },
    { icon: Globe, label: t("hero.feat3") },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-white to-white pb-20 pt-24 sm:pb-28 sm:pt-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          {t("hero.title")}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl">
          {t("hero.subtitle")}
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="#pricing"
            className="inline-flex items-center rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/35"
          >
            {t("hero.cta")}
          </a>
          <a
            href="#product"
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-7 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            {t("hero.ctaDemo")}
          </a>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-sm text-gray-500">
              <f.icon className="h-4 w-4 text-indigo-500" />
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
