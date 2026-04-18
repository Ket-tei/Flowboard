import { useTranslation } from "react-i18next";
import logoSrc from "@/assets/logo.png";

export function Footer() {
  useTranslation();

  return (
    <footer className="border-t border-gray-100 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <img src={logoSrc} alt="Flowboard" className="h-6 w-auto" />
          <span className="text-sm font-semibold text-gray-700">Flowboard</span>
        </div>
      </div>
    </footer>
  );
}
