import { useTranslation } from "react-i18next";
import logoSrc from "@/assets/logo.png";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-gray-100 bg-white py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <div className="flex items-center gap-2">
              <img src={logoSrc} alt="Flowboard" width={24} height={24} className="h-6 w-auto" />
              <span className="text-sm font-semibold text-gray-700">Flowboard</span>
            </div>
            <p className="text-xs text-gray-400">
              {t("footer.by")}{" "}
              <a
                href="https://canope.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Canope
              </a>
            </p>
          </div>

          {/* Legal links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
            <a
              href="/docs"
              className="hover:text-indigo-600 transition-colors"
            >
              {t("footer.docs")}
            </a>
            <a
              href="/legal"
              className="hover:text-indigo-600 transition-colors"
            >
              {t("footer.legal")}
            </a>
            <a
              href="/privacy"
              className="hover:text-indigo-600 transition-colors"
            >
              {t("footer.privacy")}
            </a>
            <a
              href="/terms"
              className="hover:text-indigo-600 transition-colors"
            >
              {t("footer.terms")}
            </a>
            <a
              href="mailto:support@canope.org"
              className="hover:text-indigo-600 transition-colors"
            >
              {t("footer.contact")}
            </a>
          </nav>
        </div>

      </div>
    </footer>
  );
}
