import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import {
  CreateTransactionBody,
  UpdateTransactionBody,
  GetTransactionParams,
  UpdateTransactionParams,
  DeleteTransactionParams,
  RateTransactionRegretParams,
  RateTransactionRegretBody,
  ListTransactionsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeTx(t: typeof transactionsTable.$inferSelect) {
  return {
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
  };
}

router.get("/transactions", async (req, res): Promise<void> => {
  const query = ListTransactionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let q = db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt))
    .$dynamic();

  if (query.data.type) {
    q = q.where(eq(transactionsTable.type, query.data.type));
  }

  const limit = query.data.limit ?? 50;
  const rows = await q.limit(limit);
  res.json(rows.map(serializeTx));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      amount: String(parsed.data.amount),
      type: parsed.data.type,
      category: parsed.data.category,
      description: parsed.data.description,
      date: parsed.data.date,
      moodAtPurchase: parsed.data.moodAtPurchase ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json(serializeTx(tx));
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const params = GetTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [tx] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, params.data.id));

  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(serializeTx(tx));
});

router.patch("/transactions/:id", async (req, res): Promise<void> => {
  const params = UpdateTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.amount !== undefined)
    updateData.amount = String(parsed.data.amount);
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
  if (parsed.data.category !== undefined)
    updateData.category = parsed.data.category;
  if (parsed.data.description !== undefined)
    updateData.description = parsed.data.description;
  if (parsed.data.date !== undefined) updateData.date = parsed.data.date;
  if (parsed.data.moodAtPurchase !== undefined)
    updateData.moodAtPurchase = parsed.data.moodAtPurchase;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const [tx] = await db
    .update(transactionsTable)
    .set(updateData)
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(serializeTx(tx));
});

router.delete("/transactions/:id", async (req, res): Promise<void> => {
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [tx] = await db
    .delete(transactionsTable)
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch(
  "/transactions/:id/regret",
  async (req, res): Promise<void> => {
    const params = RateTransactionRegretParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = RateTransactionRegretBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [tx] = await db
      .update(transactionsTable)
      .set({
        regretScore: parsed.data.score,
        notes: parsed.data.notes ?? undefined,
      })
      .where(eq(transactionsTable.id, params.data.id))
      .returning();

    if (!tx) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    res.json(serializeTx(tx));
  }
);

export default router;
