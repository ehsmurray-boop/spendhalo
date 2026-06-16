import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePro } from "@/hooks/use-pro";

interface ProGateProps {
  children: ReactNode;
  feature: string;
  description?: string;
}

export function ProGate({ children, feature, description }: ProGateProps) {
  const { isPro, isLoading } = usePro();
  const [, setLocation] = useLocation();

  if (isLoading) return null;
  if (isPro) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Lock className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
        {feature} is a Pro feature
      </h2>
      <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
        {description ?? "Upgrade to SpendHalo Pro to unlock this feature and all behavioral insights."}
      </p>
      <Button
        size="lg"
        className="gap-2"
        onClick={() => setLocation("/upgrade")}
        data-testid="btn-upgrade-cta"
      >
        <Sparkles className="w-4 h-4" />
        Upgrade to Pro
      </Button>
    </div>
  );
}
