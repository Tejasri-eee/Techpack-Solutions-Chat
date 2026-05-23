import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  productName: text("product_name").notNull(),
  quantity: text("quantity"),
  notes: text("notes"),
  status: text("status", { enum: ["new", "contacted", "quoted", "closed"] })
    .default("new")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Order = typeof ordersTable.$inferSelect;
export type InsertOrder = typeof ordersTable.$inferInsert;
