import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";

const router: IRouter = Router();

// GET /settings — public, returns all settings as a flat key→value map
router.get("/settings", async (_req, res): Promise<void> => {
  const rows = await db.select().from(settingsTable);
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  res.json(result);
});

export default router;
