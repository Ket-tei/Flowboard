import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";

export function HelpPage() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t("help.title")} />
      <p className="text-muted-foreground text-sm">À venir.</p>
    </div>
  );
}
