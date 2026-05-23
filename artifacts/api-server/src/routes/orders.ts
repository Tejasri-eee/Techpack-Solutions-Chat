import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import {
  CreateOrderBody,
  GetOrdersResponse,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusResponse,
} from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

// POST /orders — customer submits a quote request
router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid order body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [order] = await db.insert(ordersTable).values(parsed.data).returning();
  req.log.info({ orderId: order.id, product: order.productName }, "Order received");
  res.status(201).json(order);
});

// GET /orders — list all orders (admin)
router.get("/orders", async (req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt));
  res.json(GetOrdersResponse.parse(orders));
});

// PATCH /orders/:id/status — update order status (admin)
router.patch("/orders/:id/status", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  req.log.info({ orderId: order.id, status: order.status }, "Order status updated");
  res.json(UpdateOrderStatusResponse.parse(order));
});

export default router;
