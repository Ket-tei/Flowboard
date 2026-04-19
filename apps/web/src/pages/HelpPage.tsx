import { useTranslation } from "react-i18next";
import { BookOpen, ExternalLink, Mail, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTutorial } from "@/context/tutorial-context";

export function HelpPage() {
  const { t } = useTranslation();
  const { startTutorial } = useTutorial();

  return (
    <div className="space-y-5 max-w-2xl">
      {/* About */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="size-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold">{t("help.aboutTitle")}</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{t("help.aboutDesc")}</p>
      </div>

      {/* Links */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          {t("help.linksTitle")}
        </h2>
        <div className="space-y-3">
          <a
            href="https://flowboard.canope.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors"
          >
            <ExternalLink className="size-4 text-muted-foreground shrink-0" />
            <span className="flex-1">{t("help.landingLink")}</span>
            <span className="text-xs text-muted-foreground">flowboard.canope.org</span>
          </a>
          <a
            href="https://canope.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors"
          >
            <ExternalLink className="size-4 text-muted-foreground shrink-0" />
            <span className="flex-1">{t("help.canopeLink")}</span>
            <span className="text-xs text-muted-foreground">canope.org</span>
          </a>
          <a
            href="mailto:support@canope.org"
            className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors"
          >
            <Mail className="size-4 text-muted-foreground shrink-0" />
            <span className="flex-1">{t("help.supportEmail")}</span>
            <span className="text-xs text-muted-foreground">support@canope.org</span>
          </a>
        </div>
      </div>

      {/* Tutorial */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <PlayCircle className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold mb-1">{t("help.tutorialTitle")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {t("help.tutorialDesc")}
            </p>
            <Button
              type="button"
              size="sm"
              className="h-9 gap-2 rounded-full px-5"
              onClick={startTutorial}
            >
              <PlayCircle className="size-4" />
              {t("help.startTutorial")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
