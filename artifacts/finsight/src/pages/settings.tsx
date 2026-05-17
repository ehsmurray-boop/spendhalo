import React from "react";
import { useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = React.useState({
    name: "",
    hourlyWage: "",
    currency: "",
    monthlyIncomeGoal: "",
    monthlySavingsGoal: "",
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        hourlyWage: profile.hourlyWage?.toString() || "",
        currency: profile.currency || "USD",
        monthlyIncomeGoal: profile.monthlyIncomeGoal?.toString() || "",
        monthlySavingsGoal: profile.monthlySavingsGoal?.toString() || "",
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      {
        data: {
          name: formData.name,
          hourlyWage: Number(formData.hourlyWage),
          currency: formData.currency,
          monthlyIncomeGoal: formData.monthlyIncomeGoal ? Number(formData.monthlyIncomeGoal) : null,
          monthlySavingsGoal: formData.monthlySavingsGoal ? Number(formData.monthlySavingsGoal) : null,
        }
      },
      {
        onSuccess: () => {
          toast({ title: "Settings saved", description: "Your profile has been updated." });
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) return <Skeleton className="w-full max-w-md h-[400px]" />;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif tracking-tight text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure your profile and financial goals.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your hourly wage is critical as it powers the Time Cost view.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required data-testid="input-name" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyWage">Hourly Wage</Label>
                <Input id="hourlyWage" name="hourlyWage" type="number" step="0.01" value={formData.hourlyWage} onChange={handleChange} required data-testid="input-hourly-wage" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" name="currency" value={formData.currency} onChange={handleChange} required data-testid="input-currency" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyIncomeGoal">Monthly Income Goal</Label>
                <Input id="monthlyIncomeGoal" name="monthlyIncomeGoal" type="number" step="1" value={formData.monthlyIncomeGoal} onChange={handleChange} data-testid="input-income-goal" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlySavingsGoal">Monthly Savings Goal</Label>
                <Input id="monthlySavingsGoal" name="monthlySavingsGoal" type="number" step="1" value={formData.monthlySavingsGoal} onChange={handleChange} data-testid="input-savings-goal" />
              </div>
            </div>

            <Button type="submit" disabled={updateProfile.isPending} data-testid="btn-save-settings">
              {updateProfile.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
