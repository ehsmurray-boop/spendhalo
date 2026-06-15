import React, { useState } from "react";
import { ProGate } from "@/components/pro-gate";
import { useListMoodLogs, useCreateMoodLog, useGetMoodCorrelation, getListMoodLogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

const MOODS = ["happy", "calm", "stressed", "anxious", "bored", "sad", "excited", "angry"];

function MoodContent() {
  const { data: logs, isLoading: loadingLogs } = useListMoodLogs();
  const { data: correlation, isLoading: loadingCorr } = useGetMoodCorrelation();
  const createMutation = useCreateMoodLog();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedMood, setSelectedMood] = useState("");
  const [note, setNote] = useState("");

  const handleLogMood = () => {
    if (!selectedMood) return;
    createMutation.mutate({
      data: { mood: selectedMood, note }
    }, {
      onSuccess: () => {
        toast({ title: "Mood logged" });
        queryClient.invalidateQueries({ queryKey: getListMoodLogsQueryKey() });
        setSelectedMood("");
        setNote("");
      }
    });
  };

  if (loadingLogs || loadingCorr) return <Skeleton className="h-[400px] w-full" />;

  const getMoodColor = (mood: string) => {
    const colors: Record<string, string> = {
      happy: "#f59e0b", calm: "#3b82f6", stressed: "#ef4444", 
      anxious: "#f97316", bored: "#8b5cf6", sad: "#6366f1", 
      excited: "#10b981", angry: "#dc2626"
    };
    return colors[mood] || "var(--color-primary)";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif tracking-tight text-foreground mb-2">Mood & Money</h1>
        <p className="text-muted-foreground">Emotions drive spending. Notice the patterns.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>How are you feeling today?</CardTitle>
            <CardDescription>Log your mood to correlate with today's spending.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-4 gap-2">
              {MOODS.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMood(m)}
                  className={`p-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                    selectedMood === m 
                      ? "bg-primary text-primary-foreground border-primary scale-105" 
                      : "bg-card text-card-foreground hover:border-primary/50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <Input 
              placeholder="Any notes? (Optional)" 
              value={note} 
              onChange={e => setNote(e.target.value)}
            />
            <Button onClick={handleLogMood} disabled={!selectedMood || createMutation.isPending} className="w-full">
              Log Mood
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Mood</CardTitle>
            <CardDescription>Average spend per logged mood day.</CardDescription>
          </CardHeader>
          <CardContent>
            {correlation && correlation.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={correlation} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 20 }}>
                    <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                    <YAxis dataKey="mood" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} capitalize="true" />
                    <RechartsTooltip cursor={{ fill: 'transparent' }} formatter={(value: number) => [`$${value.toFixed(2)}`, 'Avg Spend']} />
                    <Bar dataKey="avgSpend" radius={[0, 4, 4, 0]} barSize={24}>
                      {correlation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getMoodColor(entry.mood)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground border border-dashed rounded-md">
                Not enough data. Log moods and expenses to see patterns.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Mood() {
  return (
    <ProGate feature="Mood & Money" description="Correlate your emotional state with spending patterns to understand the triggers behind your financial decisions.">
      <MoodContent />
    </ProGate>
  );
}
