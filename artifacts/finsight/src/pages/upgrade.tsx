import { useState, useEffect } from "react";
import { Check, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePro } from "@/hooks/use-pro";
import { useLocation } from "wouter";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  prices: Price[];
}

const PRO_FEATURES = [
  "Spending DNA — your behavioral fingerprint",
  "Regret Analysis — discover costly patterns",
  "What-If Simulator — model life decisions",
  "Mood & Money correlation",
  "Unlimited transaction history",
  "Advanced category insights",
];

export default function Upgrade() {
  const { isPro, userId, refresh } = usePro();
  const [, setLocation] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<"month" | "year">("month");
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.data ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setPortalLoading(false);
    }
  };

  const allPrices = products.flatMap((p) =>
    p.prices.map((price) => ({ ...price, productName: p.name, productDescription: p.description }))
  );
  const visiblePrices = allPrices.filter(
    (p) => p.recurring?.interval === selectedInterval
  );

  if (isPro) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl font-serif font-semibold">You're on Pro</h1>
        <p className="text-muted-foreground">All features are unlocked. Enjoy the full FinSight experience.</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => setLocation("/")} data-testid="btn-go-home">
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={handlePortal} disabled={portalLoading} data-testid="btn-manage-subscription">
            {portalLoading ? "Loading..." : "Manage Subscription"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="secondary" className="gap-1 text-xs px-3 py-1">
          <Zap className="w-3 h-3" /> FinSight Pro
        </Badge>
        <h1 className="text-4xl font-serif font-semibold text-foreground">
          Understand your money at a deeper level
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Unlock behavioral analytics that no other finance app offers.
        </p>
      </div>

      {/* Interval toggle */}
      <div className="flex justify-center">
        <div className="flex bg-muted rounded-lg p-1 gap-1" data-testid="interval-toggle">
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedInterval === "month" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
            onClick={() => setSelectedInterval("month")}
            data-testid="btn-monthly"
          >
            Monthly
          </button>
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${selectedInterval === "year" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
            onClick={() => setSelectedInterval("year")}
            data-testid="btn-yearly"
          >
            Yearly
            <Badge variant="secondary" className="text-xs py-0">Save 28%</Badge>
          </button>
        </div>
      </div>

      {/* Pricing card */}
      <div className="flex justify-center">
        {loading ? (
          <Card className="w-full max-w-sm h-48 animate-pulse bg-muted" />
        ) : visiblePrices.length === 0 ? (
          <Card className="w-full max-w-sm">
            <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
              Pricing unavailable — please check back shortly.
            </CardContent>
          </Card>
        ) : (
          visiblePrices.map((price) => (
            <Card
              key={price.id}
              className="w-full max-w-sm border-primary/30 shadow-lg"
              data-testid={`card-price-${price.id}`}
            >
              <CardContent className="pt-8 pb-8 space-y-6">
                <div className="text-center space-y-1">
                  <div className="text-4xl font-bold text-foreground">
                    ${((price.unit_amount ?? 0) / 100).toFixed(2)}
                    <span className="text-base font-normal text-muted-foreground">
                      /{price.recurring?.interval}
                    </span>
                  </div>
                  {selectedInterval === "year" && (
                    <p className="text-sm text-muted-foreground">
                      ${(((price.unit_amount ?? 0) / 100) / 12).toFixed(2)}/month billed annually
                    </p>
                  )}
                </div>

                <ul className="space-y-3">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => handleCheckout(price.id)}
                  disabled={checkoutLoading === price.id}
                  data-testid={`btn-checkout-${price.id}`}
                >
                  <Sparkles className="w-4 h-4" />
                  {checkoutLoading === price.id ? "Redirecting..." : "Get Pro"}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Feature list footer */}
      <p className="text-center text-xs text-muted-foreground">
        Secure checkout powered by Stripe. Cancel anytime.
      </p>
    </div>
  );
}
