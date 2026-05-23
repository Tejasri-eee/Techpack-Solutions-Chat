import { Router, type IRouter } from "express";
import { db, leadsTable } from "@workspace/db";
import { CaptureLeadBody, GetLeadsResponse } from "@workspace/api-zod";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

// GET /leads — return all captured leads
router.get("/leads", async (req, res): Promise<void> => {
  const leads = await db
    .select()
    .from(leadsTable)
    .orderBy(desc(leadsTable.createdAt));
  res.json(GetLeadsResponse.parse(leads));
});

// POST /leads — capture a new customer lead
router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CaptureLeadBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid lead body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lead] = await db
    .insert(leadsTable)
    .values(parsed.data)
    .returning();

  req.log.info({ leadId: lead.id, name: lead.name }, "Lead captured");
  res.status(201).json(lead);
});

export default router;
