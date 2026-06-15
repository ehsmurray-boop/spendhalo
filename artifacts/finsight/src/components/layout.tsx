import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { usePro } from "@/hooks/use-pro";
import {
  BarChart,
  Wallet,
  Clock,
  Brain,
  Heart,
  Dna,
  ThumbsDown,
  Settings,
  Sparkles,
  Lock,
} from "lucide-react";

const FREE_NAV = [
  { href: "/", label: "Dashboard", icon: BarChart, pro: false },
  { href: "/transactions", label: "Transactions", icon: Wallet, pro: false },
  { href: "/time-cost", label: "Time Cost", icon: Clock, pro: false },
];

const PRO_NAV = [
  { href: "/what-if", label: "What If?", icon: Brain, pro: true },
  { href: "/mood", label: "Mood & Money", icon: Heart, pro: true },
  { href: "/dna", label: "Spending DNA", icon: Dna, pro: true },
  { href: "/regret", label: "Regret Analysis", icon: ThumbsDown, pro: true },
];

const BOTTOM_NAV = [
  { href: "/settings", label: "Settings", icon: Settings, pro: false },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { isPro } = usePro();

  const allNav = [...FREE_NAV, ...PRO_NAV, ...BOTTOM_NAV];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-sidebar border-r border-sidebar-border p-4 flex flex-col gap-4 sticky top-0 md:h-screen z-10 overflow-y-auto">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold italic">
            F
          </div>
          <span className="text-xl font-serif font-semibold tracking-tight text-sidebar-foreground">FinSight</span>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {/* Free nav items */}
          {FREE_NAV.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          {/* Pro section divider */}
          <div className="mt-3 mb-1 px-3">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Pro Features
            </span>
          </div>

          {PRO_NAV.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            const locked = !isPro;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1">{item.label}</span>
                {locked && <Lock className="w-3 h-3 opacity-40" />}
              </Link>
            );
          })}

          <div className="mt-2">
            {BOTTOM_NAV.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Upgrade CTA — only shown to free users */}
        {!isPro && (
          <Link
            href="/upgrade"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/15 transition-colors text-sm font-medium text-primary"
            data-testid="nav-upgrade"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Pro
          </Link>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 lg:p-12 animate-in fade-in duration-500 pb-24 md:pb-12">
        {children}
      </main>
    </div>
  );
}
