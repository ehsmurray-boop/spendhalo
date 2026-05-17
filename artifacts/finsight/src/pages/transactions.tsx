import React, { useState } from "react";
import { 
  useListTransactions, 
  useCreateTransaction, 
  useDeleteTransaction, 
  useRateTransactionRegret,
  getListTransactionsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, Trash2 } from "lucide-react";

export default function Transactions() {
  const [filterType, setFilterType] = useState<string>("all");
  const { data: transactions, isLoading } = useListTransactions({ 
    type: filterType !== "all" ? filterType as any : undefined 
  });
  const deleteMutation = useDeleteTransaction();
  const rateMutation = useRateTransactionRegret();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Transaction deleted" });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      }
    });
  };

  const handleRateRegret = (id: number, score: number) => {
    rateMutation.mutate({ id, data: { score } }, {
      onSuccess: () => {
        toast({ title: "Regret rating saved" });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      }
    });
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-[400px] w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-tight text-foreground mb-2">Transactions</h1>
          <p className="text-muted-foreground">Every purchase tells a story. What's yours?</p>
        </div>
        <AddTransactionDialog />
      </div>

      <div className="flex gap-4 mb-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="expense">Expenses Only</SelectItem>
            <SelectItem value="income">Income Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {transactions?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No transactions found.</div>
            )}
            {transactions?.map((tx) => (
              <div key={tx.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-lg">{tx.description}</span>
                    <span className="text-xs px-2 py-1 bg-secondary rounded-full">{tx.category}</span>
                    {tx.moodAtPurchase && (
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Mood: {tx.moodAtPurchase}</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(tx.date).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className={`text-xl font-semibold ${tx.type === 'expense' ? 'text-destructive' : 'text-green-600'}`}>
                    {tx.type === 'expense' ? '-' : '+'}${tx.amount.toFixed(2)}
                  </div>

                  {tx.type === 'expense' && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Regret</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 cursor-pointer transition-colors ${
                              (tx.regretScore || 0) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted hover:text-yellow-200'
                            }`}
                            onClick={() => handleRateRegret(tx.id, star)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)} disabled={deleteMutation.isPending} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateTransaction();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      data: {
        amount: Number(fd.get("amount")),
        type: fd.get("type") as "expense" | "income",
        category: fd.get("category") as string,
        description: fd.get("description") as string,
        date: fd.get("date") as string,
        moodAtPurchase: fd.get("mood") as string || undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Transaction added" });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select name="type" defaultValue="expense">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input name="amount" type="number" step="0.01" required min="0.01" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input name="description" required />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input name="category" required />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>
          <div className="space-y-2">
            <Label>Mood at Purchase (Optional)</Label>
            <Select name="mood">
              <SelectTrigger><SelectValue placeholder="Select a mood..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="happy">Happy</SelectItem>
                <SelectItem value="calm">Calm</SelectItem>
                <SelectItem value="stressed">Stressed</SelectItem>
                <SelectItem value="anxious">Anxious</SelectItem>
                <SelectItem value="bored">Bored</SelectItem>
                <SelectItem value="sad">Sad</SelectItem>
                <SelectItem value="excited">Excited</SelectItem>
                <SelectItem value="angry">Angry</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Save Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
