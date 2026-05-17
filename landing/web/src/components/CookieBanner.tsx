import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import posthog from "posthog-js";

const CONSENT_KEY = "cookie_consent";

export function CookieBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    posthog.opt_in_capturing();
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 py-5 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-xl">🍪</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{t("cookies.title")}</p>
            <p className="mt-0.5 text-sm text-gray-500 leading-relaxed">
              {t("cookies.message")}{" "}
              <a
                href="/privacy"
                className="font-medium text-indigo-600 hover:underline transition-colors"
              >
                {t("cookies.learnMore")}
              </a>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={decline}
            className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            {t("cookies.decline")}
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            {t("cookies.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
