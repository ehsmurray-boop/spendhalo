import React from "react";
import { useGetTimeCostBreakdown } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";

export default function TimeCost() {
  const { data: items, isLoading } = useGetTimeCostBreakdown();

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif tracking-tight text-foreground mb-2">Time Cost</h1>
        <p className="text-muted-foreground">Every dollar spent is time you had to work. Here is your spending translated into hours of your life.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expenses as Hours Worked</CardTitle>
          <CardDescription>Based on the hourly wage configured in your settings.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {items?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No data available. Add some expenses and ensure your hourly wage is set.</div>
            )}
            {items?.map((item, idx) => (
              <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                <div>
                  <div className="font-medium text-lg">{item.description}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(item.date).toLocaleDateString()} • {item.category}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Financial Cost</div>
                    <div className="font-semibold text-destructive">${item.amount.toFixed(2)}</div>
                  </div>
                  <div className="h-8 w-px bg-border hidden md:block"></div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Time Cost</div>
                    <div className="font-semibold text-primary flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {item.hoursOfWork.toFixed(1)} hrs
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
