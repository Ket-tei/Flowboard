import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  MonitorPlay,
  Users,
  Settings,
  CreditCard,
  HelpCircle,
  Menu,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import logoSrc from "@/assets/LogoTemporaire.png";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const items = [
  { to: "/app/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { to: "/app/screens", key: "nav.screens", icon: MonitorPlay },
  { to: "/app/accounts", key: "nav.accounts", icon: Users, adminOnly: true },
  { to: "/app/billing", key: "nav.billing", icon: CreditCard },
  { to: "/app/settings", key: "nav.settings", icon: Settings },
  { to: "/app/help", key: "nav.help", icon: HelpCircle },
] as const;

function NavItems({
  onNavigate,
  navClassName,
}: {
  onNavigate?: () => void;
  navClassName?: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const visible = useMemo(() => {
    return items.filter(
      (i) => !("adminOnly" in i && i.adminOnly) || user?.role === "ADMIN"
    );
  }, [user?.role]);

  return (
    <nav className={cn("flex flex-1 flex-col gap-0.5 px-2 pb-3", navClassName)}>
      {visible.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border",
              isActive
                ? "bg-muted text-foreground"
                : "text-foreground/90 hover:bg-muted/60"
            )
          }
        >
          <item.icon className="size-[18px] shrink-0 opacity-90" />
          <span className="truncate">{t(item.key)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sectionTitle = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith("/app/screens")) return t("nav.screens");
    if (p.startsWith("/app/accounts")) return t("nav.accounts");
    if (p.startsWith("/app/settings")) return t("nav.settings");
    if (p.startsWith("/app/billing")) return t("nav.billing");
    if (p.startsWith("/app/help")) return t("nav.help");
    return t("nav.dashboard");
  }, [location.pathname, t]);

  return (
    <div className="bg-muted/40 flex h-svh flex-col overflow-hidden md:flex-row">
      <aside className="bg-card hidden w-56 shrink-0 flex-col border-r border-border shadow-[1px_0_0_0] shadow-border/60 md:flex">
        <div className="border-b border-border px-4 py-3">
          <NavLink to="/app/dashboard" className="flex items-center gap-2">
            <img src={logoSrc} alt={t("app.name")} className="h-7 w-auto" />
            <span className="text-foreground text-[15px] font-semibold tracking-tight">
              {t("app.name")}
            </span>
          </NavLink>
        </div>
        <div className="flex min-h-0 flex-1 flex-col pt-1.5">
          <NavItems />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
        <header className="bg-background/95 flex h-12 shrink-0 items-center gap-3 border-b border-border px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              type="button"
              className={cn(buttonVariants({ variant: "outline", size: "icon" }), "md:hidden")}
              aria-label={t("layout.openMenu")}
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[min(100%,260px)] flex-col p-0">
              <SheetHeader className="border-b border-border px-4 py-3 text-left">
                <SheetTitle className="flex items-center gap-2">
                  <img src={logoSrc} alt={t("app.name")} className="h-6 w-auto" />
                  {t("app.name")}
                </SheetTitle>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col overflow-auto pt-1.5">
                <NavItems onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <Separator orientation="vertical" className="h-5 md:hidden" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-foreground truncate text-sm font-semibold tracking-tight">
              {sectionTitle}
            </span>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl px-3 py-3 md:px-4 md:py-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
