import React, { useState } from "react";
import { ProGate } from "@/components/pro-gate";
import { useListScenarios, useCreateScenario, useDeleteScenario, getListScenariosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Trash2 } from "lucide-react";

function WhatIfContent() {
  const { data: scenarios, isLoading } = useListScenarios();
  const deleteMutation = useDeleteScenario();
  const createMutation = useCreateScenario();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    changeDescription: "",
    monthlySavingsDelta: "",
    projectionYears: "10",
    annualReturnRate: "0.07"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        name: formData.name,
        changeDescription: formData.changeDescription,
        monthlySavingsDelta: Number(formData.monthlySavingsDelta),
        projectionYears: Number(formData.projectionYears),
        annualReturnRate: Number(formData.annualReturnRate)
      }
    }, {
      onSuccess: () => {
        toast({ title: "Scenario saved" });
        queryClient.invalidateQueries({ queryKey: getListScenariosQueryKey() });
        setFormData({ name: "", changeDescription: "", monthlySavingsDelta: "", projectionYears: "10", annualReturnRate: "0.07" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListScenariosQueryKey() });
      }
    });
  };

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif tracking-tight text-foreground mb-2">What If? Simulator</h1>
        <p className="text-muted-foreground">Model behavioral changes and see their compounding impact on your future wealth.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Create Scenario</CardTitle>
            <CardDescription>What behavior are you changing?</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Scenario Name</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} placeholder="e.g. Stop eating out" required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formData.changeDescription} onChange={e => setFormData(p => ({...p, changeDescription: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <Label>Monthly Savings Delta ($)</Label>
                <Input type="number" value={formData.monthlySavingsDelta} onChange={e => setFormData(p => ({...p, monthlySavingsDelta: e.target.value}))} placeholder="200" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Years</Label>
                  <Input type="number" min="1" max="40" value={formData.projectionYears} onChange={e => setFormData(p => ({...p, projectionYears: e.target.value}))} required />
                </div>
                <div className="space-y-2">
                  <Label>Return Rate</Label>
                  <Input type="number" step="0.01" value={formData.annualReturnRate} onChange={e => setFormData(p => ({...p, annualReturnRate: e.target.value}))} required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                Simulate
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          {scenarios?.length === 0 && (
            <Card className="h-full flex items-center justify-center min-h-[300px] border-dashed">
              <div className="text-center text-muted-foreground">Create a scenario to see the projection.</div>
            </Card>
          )}

          {scenarios?.map(scenario => (
            <Card key={scenario.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2 border-b">
                <div>
                  <CardTitle>{scenario.name}</CardTitle>
                  <CardDescription>{scenario.changeDescription}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(scenario.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4 grid md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-1 space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">Monthly Change</div>
                    <div className="text-xl font-semibold text-green-600">+${scenario.monthlySavingsDelta}/mo</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">Future Value ({scenario.projectionYears} yrs)</div>
                    <div className="text-2xl font-bold font-serif text-primary">${scenario.projectedSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>
                
                <div className="md:col-span-2 h-[200px]">
                  {scenario.monthlyBreakdown && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scenario.monthlyBreakdown.filter((_, i) => i % 12 === 0)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="month" tickFormatter={(v) => `Y${Math.floor(v/12)}`} fontSize={10} stroke="#888888" tickLine={false} axisLine={false} />
                        <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} fontSize={10} stroke="#888888" tickLine={false} axisLine={false} width={45} />
                        <Tooltip formatter={(value: number) => [`$${value.toFixed(0)}`, 'Projected Value']} labelFormatter={(v) => `Month ${v}`} />
                        <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WhatIf() {
  return (
    <ProGate feature="What-If Simulator" description="Model compound growth and simulate what life decisions would look like if you invested that money instead.">
      <WhatIfContent />
    </ProGate>
  );
}
