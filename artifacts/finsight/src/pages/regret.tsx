import React from "react";
import { useGetRegretAnalysis, useRateTransactionRegret, getGetRegretAnalysisQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Regret() {
  const { data: analysis, isLoading } = useGetRegretAnalysis();
  const rateMutation = useRateTransactionRegret();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRateRegret = (id: number, score: number) => {
    rateMutation.mutate({ id, data: { score } }, {
      onSuccess: () => {
        toast({ title: "Regret rating updated" });
        queryClient.invalidateQueries({ queryKey: getGetRegretAnalysisQueryKey() });
      }
    });
  };

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;
  if (!analysis) return <div>No data</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif tracking-tight text-foreground mb-2">Regret Analysis</h1>
        <p className="text-muted-foreground">Understanding which purchases brought joy and which brought regret helps align future spending with values.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Regret Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary flex items-center gap-1">
              {analysis.avgRegretScore.toFixed(1)} <Star className="w-5 h-5 fill-primary text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Regretted $</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">${analysis.totalRegretted.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Regretted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold truncate">{analysis.mostRegrettedCategory || "N/A"}</div>
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Least Regretted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold truncate">{analysis.leastRegrettedCategory || "N/A"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top Regretted Transactions</CardTitle>
            <CardDescription>Items rated 4 or 5 stars in regret</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {analysis.topRegrettedTransactions?.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">No highly regretted transactions. Great job!</div>
              )}
              {analysis.topRegrettedTransactions?.map(tx => (
                <div key={tx.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{tx.description}</div>
                    <div className="text-sm text-muted-foreground">{tx.category} • {new Date(tx.date).toLocaleDateString()}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="font-semibold text-destructive">${tx.amount.toFixed(2)}</div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-3 h-3 cursor-pointer ${
                            (tx.regretScore || 0) >= star ? 'fill-destructive text-destructive' : 'text-muted'
                          }`}
                          onClick={() => handleRateRegret(tx.id, star)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Regret by Category</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {analysis.regretByCategory?.map((cat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium truncate max-w-[120px]">{cat.category}</span>
                    <span className="text-muted-foreground">{cat.avgRegretScore.toFixed(1)} <Star className="w-3 h-3 inline fill-current" /></span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-destructive h-full transition-all" 
                      style={{ width: `${(cat.avgRegretScore / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
