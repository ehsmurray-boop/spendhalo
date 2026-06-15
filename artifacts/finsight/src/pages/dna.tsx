import React from "react";
import { useGetSpendingDna } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BrainCircuit, Lightbulb, Zap, RefreshCw } from "lucide-react";
import { ProGate } from "@/components/pro-gate";

function DnaContent() {
  const { data: dna, isLoading } = useGetSpendingDna();

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;
  if (!dna) return <div>No DNA data available</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif tracking-tight text-foreground mb-2">Spending DNA</h1>
        <p className="text-muted-foreground">Your behavioral fingerprint based on transaction history.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-full min-h-[250px] space-y-4">
            <BrainCircuit className="w-12 h-12 text-primary opacity-80" />
            <div>
              <div className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-1">Your Spending Personality</div>
              <div className="text-3xl font-serif font-bold text-foreground">{dna.spendingPersonality}</div>
            </div>
            <div className="text-muted-foreground text-sm">Dominant category: <span className="font-semibold text-foreground">{dna.dominantCategory}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Behavioral Scores</CardTitle>
            <CardDescription>How your spending patterns break down</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: "Impulse Score", value: dna.impulseScore, desc: "Tendency for small, unplanned purchases" },
              { label: "Consistency", value: dna.consistencyScore, desc: "How regular your spending patterns are" },
              { label: "Diversity", value: dna.diversityScore, desc: "How spread across categories you spend" },
            ].map(({ label, value, desc }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-sm font-bold text-foreground">{value}/100</span>
                </div>
                <Progress value={value} className="h-2" />
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="w-4 h-4 text-primary" /> Detected Patterns
          </CardTitle>
          <CardDescription>Peak spending day: <span className="font-semibold text-foreground">{dna.peakSpendingDay}</span></CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {dna.topPatterns.map((pattern, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{pattern}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dna() {
  return (
    <ProGate feature="Spending DNA" description="See your unique behavioral fingerprint — spending personality, impulse score, peak spending day, and detected patterns.">
      <DnaContent />
    </ProGate>
  );
}
