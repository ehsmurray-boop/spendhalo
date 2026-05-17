import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profileTable } from "@workspace/db";
import {
  UpdateProfileBody,
  GetProfileResponse,
  UpdateProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Ensure a default profile row exists
async function ensureProfile() {
  const rows = await db.select().from(profileTable).limit(1);
  if (rows.length === 0) {
    const [row] = await db
      .insert(profileTable)
      .values({ name: "You", hourlyWage: "25", currency: "USD" })
      .returning();
    return row;
  }
  return rows[0];
}

router.get("/profile", async (req, res): Promise<void> => {
  const profile = await ensureProfile();
  res.json(
    GetProfileResponse.parse({
      ...profile,
      hourlyWage: Number(profile.hourlyWage),
      monthlyIncomeGoal:
        profile.monthlyIncomeGoal != null
          ? Number(profile.monthlyIncomeGoal)
          : null,
      monthlySavingsGoal:
        profile.monthlySavingsGoal != null
          ? Number(profile.monthlySavingsGoal)
          : null,
      createdAt: profile.createdAt.toISOString(),
    })
  );
});

router.patch("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const profile = await ensureProfile();
  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.currency !== undefined)
    updateData.currency = parsed.data.currency;
  if (parsed.data.hourlyWage !== undefined)
    updateData.hourlyWage = String(parsed.data.hourlyWage);
  if (parsed.data.monthlyIncomeGoal !== undefined)
    updateData.monthlyIncomeGoal =
      parsed.data.monthlyIncomeGoal != null
        ? String(parsed.data.monthlyIncomeGoal)
        : null;
  if (parsed.data.monthlySavingsGoal !== undefined)
    updateData.monthlySavingsGoal =
      parsed.data.monthlySavingsGoal != null
        ? String(parsed.data.monthlySavingsGoal)
        : null;

  const [updated] = await db
    .update(profileTable)
    .set(updateData)
    .where(eq(profileTable.id, profile.id))
    .returning();

  res.json(
    UpdateProfileResponse.parse({
      ...updated,
      hourlyWage: Number(updated.hourlyWage),
      monthlyIncomeGoal:
        updated.monthlyIncomeGoal != null
          ? Number(updated.monthlyIncomeGoal)
          : null,
      monthlySavingsGoal:
        updated.monthlySavingsGoal != null
          ? Number(updated.monthlySavingsGoal)
          : null,
      createdAt: updated.createdAt.toISOString(),
    })
  );
});

export default router;
