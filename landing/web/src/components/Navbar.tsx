import { useTranslation } from "react-i18next";
import logoSrc from "@/assets/logo.png";

type Props = {
  onLoginClick?: () => void;
};

export function Navbar({ onLoginClick }: Props) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#" className="flex items-center gap-2.5">
          <img src={logoSrc} alt="Flowboard" className="h-8 w-auto" />
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Flowboard
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
          <a href="#product" className="transition-colors hover:text-gray-900">
            {t("nav.product")}
          </a>
          <a href="#pricing" className="transition-colors hover:text-gray-900">
            {t("nav.pricing")}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoginClick}
            className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            {t("nav.login")}
          </button>
          <a
            href="#pricing"
            className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
          >
            {t("nav.signup")}
          </a>
        </div>
      </div>
    </header>
  );
}
