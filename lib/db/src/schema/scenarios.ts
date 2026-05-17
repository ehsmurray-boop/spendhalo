import { pgTable, serial, text, numeric, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scenariosTable = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  changeDescription: text("change_description").notNull(),
  monthlySavingsDelta: numeric("monthly_savings_delta", { precision: 10, scale: 2 }).notNull(),
  projectionYears: integer("projection_years").notNull(),
  annualReturnRate: numeric("annual_return_rate", { precision: 6, scale: 4 }).notNull().default("0.07"),
  projectedSavings: numeric("projected_savings", { precision: 14, scale: 2 }).notNull(),
  monthlyBreakdown: json("monthly_breakdown").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScenarioSchema = createInsertSchema(scenariosTable).omit({ id: true, createdAt: true });
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scenario = typeof scenariosTable.$inferSelect;
