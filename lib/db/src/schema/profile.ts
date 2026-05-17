import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profileTable = pgTable("profile", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("You"),
  hourlyWage: numeric("hourly_wage", { precision: 10, scale: 2 }).notNull().default("25"),
  currency: text("currency").notNull().default("USD"),
  monthlyIncomeGoal: numeric("monthly_income_goal", { precision: 10, scale: 2 }),
  monthlySavingsGoal: numeric("monthly_savings_goal", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profileTable).omit({ id: true, createdAt: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profileTable.$inferSelect;
