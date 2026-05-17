import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, transactionsTable, moodLogsTable, profileTable } from "@workspace/db";

const router: IRouter = Router();

// ── Dashboard Summary ─────────────────────────────────────────────────────
router.get("/insights/dashboard", async (_req, res): Promise<void> => {
  const allTx = await db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.date));

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let totalIncome = 0;
  let totalExpenses = 0;
  let currentMonthIncome = 0;
  let currentMonthExpenses = 0;
  const catTotals: Record<string, number> = {};
  const catCounts: Record<string, number> = {};

  for (const tx of allTx) {
    const amt = Number(tx.amount);
    if (tx.type === "income") {
      totalIncome += amt;
      if (tx.date.startsWith(currentMonth)) currentMonthIncome += amt;
    } else {
      totalExpenses += amt;
      if (tx.date.startsWith(currentMonth)) currentMonthExpenses += amt;
      catTotals[tx.category] = (catTotals[tx.category] ?? 0) + amt;
      catCounts[tx.category] = (catCounts[tx.category] ?? 0) + 1;
    }
  }

  const netBalance = totalIncome - totalExpenses;
  const savingsRate =
    totalIncome > 0
      ? Math.max(0, Math.min(100, ((totalIncome - totalExpenses) / totalIncome) * 100))
      : 0;

  // Average daily spend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysStr = thirtyDaysAgo.toISOString().split("T")[0];
  const recentExpenses = allTx.filter(
    (t) => t.type === "expense" && t.date >= thirtyDaysStr
  );
  const avgDailySpend =
    recentExpenses.reduce((s, t) => s + Number(t.amount), 0) / 30;

  const topCategory =
    Object.entries(catTotals).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "";

  const totalExpenseAmount = Object.values(catTotals).reduce(
    (s, v) => s + v,
    0
  );
  const categoryBreakdown = Object.entries(catTotals)
    .map(([category, total]) => ({
      category,
      total: Math.round(total * 100) / 100,
      count: catCounts[category] ?? 0,
      percentage:
        totalExpenseAmount > 0
          ? Math.round((total / totalExpenseAmount) * 10000) / 100
          : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const recentTransactions = allTx.slice(0, 10).map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    type: t.type,
    category: t.category,
    description: t.description,
    date: t.date,
    regretScore: t.regretScore ?? null,
    moodAtPurchase: t.moodAtPurchase ?? null,
    notes: t.notes ?? null,
    createdAt: t.createdAt.toISOString(),
  }));

  res.json({
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netBalance: Math.round(netBalance * 100) / 100,
    topCategory,
    transactionCount: allTx.length,
    avgDailySpend: Math.round(avgDailySpend * 100) / 100,
    savingsRate: Math.round(savingsRate * 100) / 100,
    currentMonthIncome: Math.round(currentMonthIncome * 100) / 100,
    currentMonthExpenses: Math.round(currentMonthExpenses * 100) / 100,
    categoryBreakdown,
    recentTransactions,
  });
});

// ── Spending DNA ──────────────────────────────────────────────────────────
router.get("/insights/dna", async (_req, res): Promise<void> => {
  const allExpenses = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.type, "expense"));

  if (allExpenses.length === 0) {
    res.json({
      dominantCategory: "none",
      spendingPersonality: "The Fresh Start",
      peakSpendingDay: "unknown",
      impulseScore: 0,
      consistencyScore: 50,
      diversityScore: 0,
      topPatterns: ["No spending data yet — add your first transaction"],
    });
    return;
  }

  // Dominant category
  const catTotals: Record<string, number> = {};
  const catCounts: Record<string, number> = {};
  for (const tx of allExpenses) {
    const amt = Number(tx.amount);
    catTotals[tx.category] = (catTotals[tx.category] ?? 0) + amt;
    catCounts[tx.category] = (catCounts[tx.category] ?? 0) + 1;
  }
  const dominantCategory = Object.entries(catTotals).sort(
    ([, a], [, b]) => b - a
  )[0][0];
  const uniqueCategories = Object.keys(catTotals).length;
  const totalSpent = Object.values(catTotals).reduce((s, v) => s + v, 0);

  // Peak spending day
  const dayTotals: Record<string, number> = {
    Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0,
    Thursday: 0, Friday: 0, Saturday: 0,
  };
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (const tx of allExpenses) {
    const d = new Date(tx.date);
    const day = days[d.getDay()];
    dayTotals[day] = (dayTotals[day] ?? 0) + Number(tx.amount);
  }
  const peakSpendingDay = Object.entries(dayTotals).sort(
    ([, a], [, b]) => b - a
  )[0][0];

  // Impulse score: based on small frequent purchases and weekend spending
  const smallPurchases = allExpenses.filter((t) => Number(t.amount) < 20).length;
  const impulseScore = Math.min(
    100,
    Math.round((smallPurchases / allExpenses.length) * 100)
  );

  // Diversity score: how spread across categories (0-100)
  const maxPossibleCategories = 10;
  const diversityScore = Math.min(
    100,
    Math.round((uniqueCategories / maxPossibleCategories) * 100)
  );

  // Consistency score: how regular the spending intervals are
  const amounts = allExpenses.map((t) => Number(t.amount));
  const avg = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  const variance =
    amounts.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const cv = avg > 0 ? stdDev / avg : 1;
  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - cv * 50)));

  // Personality
  let spendingPersonality = "The Balanced Spender";
  if (impulseScore > 65) spendingPersonality = "The Impulse Artist";
  else if (dominantCategory === "Food & Dining" || dominantCategory === "Groceries")
    spendingPersonality = "The Comfort Seeker";
  else if (dominantCategory === "Entertainment" || dominantCategory === "Subscriptions")
    spendingPersonality = "The Experience Collector";
  else if (diversityScore > 70) spendingPersonality = "The Lifestyle Curator";
  else if (consistencyScore > 75) spendingPersonality = "The Disciplined Saver";
  else if (dominantCategory === "Shopping" || dominantCategory === "Clothing")
    spendingPersonality = "The Retail Therapist";
  else if (dominantCategory === "Health" || dominantCategory === "Fitness")
    spendingPersonality = "The Self-Investor";

  // Top patterns
  const topPatterns: string[] = [];
  const dominantPct =
    Math.round(((catTotals[dominantCategory] ?? 0) / totalSpent) * 100);
  topPatterns.push(
    `${dominantPct}% of your spending goes to ${dominantCategory}`
  );
  topPatterns.push(`You spend most on ${peakSpendingDay}s`);
  if (impulseScore > 50)
    topPatterns.push(`${impulseScore}% of purchases are under $20`);
  if (uniqueCategories >= 5)
    topPatterns.push(
      `Your spending spans ${uniqueCategories} categories — highly diverse`
    );
  if (consistencyScore > 70)
    topPatterns.push("Your spending amounts are very consistent month to month");
  else
    topPatterns.push("Your spending varies significantly — watch for spikes");

  res.json({
    dominantCategory,
    spendingPersonality,
    peakSpendingDay,
    impulseScore,
    consistencyScore,
    diversityScore,
    topPatterns: topPatterns.slice(0, 5),
  });
});

// ── Time Cost Breakdown ───────────────────────────────────────────────────
router.get("/insights/time-cost", async (_req, res): Promise<void> => {
  const profileRows = await db.select().from(profileTable).limit(1);
  const hourlyWage =
    profileRows.length > 0 ? Number(profileRows[0].hourlyWage) : 25;

  const expenses = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.type, "expense"))
    .orderBy(desc(transactionsTable.date));

  const items = expenses.map((t) => ({
    transactionId: t.id,
    description: t.description,
    amount: Number(t.amount),
    hoursOfWork:
      hourlyWage > 0
        ? Math.round((Number(t.amount) / hourlyWage) * 100) / 100
        : 0,
    category: t.category,
    date: t.date,
  }));

  res.json(items);
});

// ── Mood Correlation ──────────────────────────────────────────────────────
router.get("/insights/mood-correlation", async (_req, res): Promise<void> => {
  const logs = await db.select().from(moodLogsTable);

  const moodGroups: Record<string, number[]> = {};
  for (const log of logs) {
    if (!moodGroups[log.mood]) moodGroups[log.mood] = [];
    if (log.spendingAmountToday != null) {
      moodGroups[log.mood].push(Number(log.spendingAmountToday));
    }
  }

  const result = Object.entries(moodGroups).map(([mood, amounts]) => {
    const totalSpend = amounts.reduce((s, v) => s + v, 0);
    const avgSpend = amounts.length > 0 ? totalSpend / amounts.length : 0;
    return {
      mood,
      avgSpend: Math.round(avgSpend * 100) / 100,
      count: amounts.length,
      totalSpend: Math.round(totalSpend * 100) / 100,
    };
  });

  res.json(result);
});

// ── Regret Analysis ────────────────────────────────────────────────────────
router.get("/insights/regret-analysis", async (_req, res): Promise<void> => {
  const allExpenses = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.type, "expense"))
    .orderBy(desc(transactionsTable.date));

  const rated = allExpenses.filter((t) => t.regretScore != null);

  if (rated.length === 0) {
    res.json({
      avgRegretScore: 0,
      mostRegrettedCategory: "none",
      leastRegrettedCategory: "none",
      totalRegretted: 0,
      regretByCategory: [],
      topRegrettedTransactions: [],
    });
    return;
  }

  const avgRegretScore =
    rated.reduce((s, t) => s + (t.regretScore ?? 0), 0) / rated.length;

  // By category
  const catScores: Record<string, number[]> = {};
  for (const tx of rated) {
    if (!catScores[tx.category]) catScores[tx.category] = [];
    catScores[tx.category].push(tx.regretScore!);
  }
  const regretByCategory = Object.entries(catScores)
    .map(([category, scores]) => ({
      category,
      avgRegretScore:
        Math.round(
          (scores.reduce((s, v) => s + v, 0) / scores.length) * 100
        ) / 100,
      count: scores.length,
    }))
    .sort((a, b) => b.avgRegretScore - a.avgRegretScore);

  const mostRegrettedCategory = regretByCategory[0]?.category ?? "none";
  const leastRegrettedCategory =
    regretByCategory[regretByCategory.length - 1]?.category ?? "none";

  const totalRegretted = rated
    .filter((t) => (t.regretScore ?? 0) >= 4)
    .reduce((s, t) => s + Number(t.amount), 0);

  const topRegrettedTransactions = rated
    .sort((a, b) => (b.regretScore ?? 0) - (a.regretScore ?? 0))
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      type: t.type,
      category: t.category,
      description: t.description,
      date: t.date,
      regretScore: t.regretScore ?? null,
      moodAtPurchase: t.moodAtPurchase ?? null,
      notes: t.notes ?? null,
      createdAt: t.createdAt.toISOString(),
    }));

  res.json({
    avgRegretScore: Math.round(avgRegretScore * 100) / 100,
    mostRegrettedCategory,
    leastRegrettedCategory,
    totalRegretted: Math.round(totalRegretted * 100) / 100,
    regretByCategory,
    topRegrettedTransactions,
  });
});

export default router;
