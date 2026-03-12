import { useTranslation } from "react-i18next";

export function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
      <p className="text-muted-foreground">{t("dashboard.welcome")}</p>
    </div>
  );
}
