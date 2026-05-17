import React from "react";
import { useGetSpendingDna } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BrainCircuit, Lightbulb, Zap, RefreshCw } from "lucide-react";

export default function Dna() {
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
            <div className="text-muted-foreground">
              Peak Spending Day: <span className="font-semibold text-foreground capitalize">{dna.peakSpendingDay}</span>
            </div>
            <div className="text-muted-foreground">
              Dominant Category: <span className="font-semibold text-foreground">{dna.dominantCategory}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Behavioral Traits</CardTitle>
            <CardDescription>0-100 scores analyzing your habits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-orange-500" /> Impulse Score</span>
                <span className="font-bold">{dna.impulseScore}</span>
              </div>
              <Progress value={dna.impulseScore} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-blue-500" /> Consistency</span>
                <span className="font-bold">{dna.consistencyScore}</span>
              </div>
              <Progress value={dna.consistencyScore} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-green-500" /> Diversity</span>
                <span className="font-bold">{dna.diversityScore}</span>
              </div>
              <Progress value={dna.diversityScore} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detected Patterns</CardTitle>
          <CardDescription>What the data says about you</CardDescription>
        </CardHeader>
        <CardContent>
          {dna.topPatterns && dna.topPatterns.length > 0 ? (
            <ul className="space-y-4">
              {dna.topPatterns.map((pattern, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-foreground leading-relaxed">{pattern}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-muted-foreground p-4">Not enough data to detect meaningful patterns yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
