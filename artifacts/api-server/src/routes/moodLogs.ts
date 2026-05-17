import { Router, type IRouter } from "express";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { db, moodLogsTable, transactionsTable } from "@workspace/db";
import {
  CreateMoodLogBody,
  DeleteMoodLogParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeMoodLog(m: typeof moodLogsTable.$inferSelect) {
  return {
    id: m.id,
    mood: m.mood,
    note: m.note ?? null,
    spendingAmountToday:
      m.spendingAmountToday != null ? Number(m.spendingAmountToday) : null,
    loggedAt: m.loggedAt.toISOString(),
  };
}

router.get("/mood-logs", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(moodLogsTable)
    .orderBy(desc(moodLogsTable.loggedAt));
  res.json(rows.map(serializeMoodLog));
});

router.post("/mood-logs", async (req, res): Promise<void> => {
  const parsed = CreateMoodLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Compute today's spending
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const spendingRows = await db
    .select()
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.type, "expense"),
        eq(transactionsTable.date, todayStr)
      )
    );
  const spendingAmountToday = spendingRows.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  const [log] = await db
    .insert(moodLogsTable)
    .values({
      mood: parsed.data.mood,
      note: parsed.data.note ?? null,
      spendingAmountToday: String(spendingAmountToday),
    })
    .returning();

  res.status(201).json(serializeMoodLog(log));
});

router.delete("/mood-logs/:id", async (req, res): Promise<void> => {
  const params = DeleteMoodLogParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [log] = await db
    .delete(moodLogsTable)
    .where(eq(moodLogsTable.id, params.data.id))
    .returning();

  if (!log) {
    res.status(404).json({ error: "Mood log not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
