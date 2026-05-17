import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart, 
  Wallet, 
  Clock, 
  Brain, 
  Heart, 
  Dna, 
  ThumbsDown, 
  Settings 
} from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: BarChart },
    { href: "/transactions", label: "Transactions", icon: Wallet },
    { href: "/time-cost", label: "Time Cost", icon: Clock },
    { href: "/what-if", label: "What If?", icon: Brain },
    { href: "/mood", label: "Mood & Money", icon: Heart },
    { href: "/dna", label: "Spending DNA", icon: Dna },
    { href: "/regret", label: "Regret Analysis", icon: ThumbsDown },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

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
          {navItems.map((item) => {
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
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 lg:p-12 animate-in fade-in duration-500 pb-24 md:pb-12">
        {children}
      </main>
    </div>
  );
}
