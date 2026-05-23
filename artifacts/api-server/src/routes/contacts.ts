import { Router, type IRouter } from "express";
import { db, contactsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/contacts", async (_req, res): Promise<void> => {
  const contacts = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.isActive, true))
    .orderBy(desc(contactsTable.createdAt));
  res.json(contacts);
});

export default router;
