import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import {
  CreateProductBody,
  UpdateProductBody,
  UpdateProductParams,
  DeleteProductParams,
  GetProductsResponse,
  UpdateProductResponse,
} from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

// GET /products — all active products (public)
router.get("/products", async (_req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.isActive, true))
    .orderBy(desc(productsTable.createdAt));
  res.json(GetProductsResponse.parse(products));
});

// POST /products — create a product (admin)
router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid product body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db.insert(productsTable).values(parsed.data).returning();
  req.log.info({ productId: product.id }, "Product created");
  res.status(201).json(product);
});

// PUT /products/:id — update a product (admin)
router.put("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db
    .update(productsTable)
    .set(parsed.data)
    .where(eq(productsTable.id, params.data.id))
    .returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(UpdateProductResponse.parse(product));
});

// DELETE /products/:id — soft-delete (set isActive=false) or hard delete
router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .update(productsTable)
    .set({ isActive: false })
    .where(eq(productsTable.id, params.data.id));
  req.log.info({ productId: params.data.id }, "Product deactivated");
  res.sendStatus(204);
});

export default router;
