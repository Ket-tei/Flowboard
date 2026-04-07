import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/PageHeader";

export function DashboardPage() {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t("dashboard.title")} />
      <p className="text-muted-foreground text-sm">À venir.</p>
    </div>
  );
}
