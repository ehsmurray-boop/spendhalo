import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, scenariosTable } from "@workspace/db";
import {
  CreateScenarioBody,
  GetScenarioParams,
  DeleteScenarioParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computeProjection(
  monthlySavingsDelta: number,
  projectionYears: number,
  annualReturnRate: number
): { monthlyBreakdown: { month: number; value: number }[]; projectedSavings: number } {
  const monthlyRate = annualReturnRate / 12;
  const totalMonths = projectionYears * 12;
  const breakdown: { month: number; value: number }[] = [];
  let balance = 0;

  for (let m = 1; m <= totalMonths; m++) {
    balance = balance * (1 + monthlyRate) + monthlySavingsDelta;
    if (m % 3 === 0 || m === totalMonths) {
      breakdown.push({ month: m, value: Math.round(balance * 100) / 100 });
    }
  }

  return {
    monthlyBreakdown: breakdown,
    projectedSavings: Math.round(balance * 100) / 100,
  };
}

function serializeScenario(s: typeof scenariosTable.$inferSelect) {
  return {
    id: s.id,
    name: s.name,
    changeDescription: s.changeDescription,
    monthlySavingsDelta: Number(s.monthlySavingsDelta),
    projectionYears: s.projectionYears,
    annualReturnRate: Number(s.annualReturnRate),
    projectedSavings: Number(s.projectedSavings),
    monthlyBreakdown: s.monthlyBreakdown as { month: number; value: number }[],
    createdAt:
      s.createdAt instanceof Date
        ? s.createdAt.toISOString()
        : String(s.createdAt),
  };
}

router.get("/what-if", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(scenariosTable)
    .orderBy(desc(scenariosTable.createdAt));
  res.json(rows.map(serializeScenario));
});

router.post("/what-if", async (req, res): Promise<void> => {
  const parsed = CreateScenarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const annualRate = parsed.data.annualReturnRate ?? 0.07;
  const { monthlyBreakdown, projectedSavings } = computeProjection(
    parsed.data.monthlySavingsDelta,
    parsed.data.projectionYears,
    annualRate
  );

  const [scenario] = await db
    .insert(scenariosTable)
    .values({
      name: parsed.data.name,
      changeDescription: parsed.data.changeDescription,
      monthlySavingsDelta: String(parsed.data.monthlySavingsDelta),
      projectionYears: parsed.data.projectionYears,
      annualReturnRate: String(annualRate),
      projectedSavings: String(projectedSavings),
      monthlyBreakdown,
    })
    .returning();

  res.status(201).json(serializeScenario(scenario));
});

router.get("/what-if/:id", async (req, res): Promise<void> => {
  const params = GetScenarioParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [scenario] = await db
    .select()
    .from(scenariosTable)
    .where(eq(scenariosTable.id, params.data.id));

  if (!scenario) {
    res.status(404).json({ error: "Scenario not found" });
    return;
  }

  res.json(serializeScenario(scenario));
});

router.delete("/what-if/:id", async (req, res): Promise<void> => {
  const params = DeleteScenarioParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [scenario] = await db
    .delete(scenariosTable)
    .where(eq(scenariosTable.id, params.data.id))
    .returning();

  if (!scenario) {
    res.status(404).json({ error: "Scenario not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
