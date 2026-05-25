import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, contactsTable, settingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

// ── Token helpers ────────────────────────────────────────────────────────────

function makeToken(adminPassword: string): string {
  const secret = process.env.SESSION_SECRET ?? adminPassword;
  const day = Math.floor(Date.now() / 86_400_000);
  return crypto
    .createHmac("sha256", secret)
    .update(`admin:${day}:${adminPassword}`)
    .digest("hex");
}

function isValidToken(token: string, adminPassword: string): boolean {
  const secret = process.env.SESSION_SECRET ?? adminPassword;
  for (let offset = 0; offset <= 1; offset++) {
    const day = Math.floor(Date.now() / 86_400_000) - offset;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`admin:${day}:${adminPassword}`)
      .digest("hex");
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token.padEnd(expected.length)))) {
      return expected === token;
    }
  }
  return false;
}

// ── Middleware ───────────────────────────────────────────────────────────────

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(500).json({ error: "Admin not configured" });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  if (!isValidToken(token, adminPassword)) {
    req.log.warn("Invalid admin token rejected");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

// ── POST /admin/login ────────────────────────────────────────────────────────

router.post("/admin/login", async (req, res): Promise<void> => {
  const { password } = req.body as { password?: string };

  if (!password || typeof password !== "string") {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    req.log.error("ADMIN_PASSWORD environment variable is not set");
    res.status(500).json({ error: "Admin login is not configured." });
    return;
  }

  if (password !== adminPassword) {
    req.log.warn("Failed admin login attempt");
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  req.log.info("Admin logged in successfully");
  res.json({ success: true, token: makeToken(adminPassword) });
});

// ── Contacts CRUD (admin-only) ───────────────────────────────────────────────

interface ContactBody {
  name: string;
  role: string;
  phone: string;
  email?: string | null;
  location: string;
  isActive?: boolean;
}

function parseContactBody(body: unknown): { data: ContactBody } | { error: string } {
  if (!body || typeof body !== "object") return { error: "Invalid request body" };
  const b = body as Record<string, unknown>;
  if (!b.name || typeof b.name !== "string") return { error: "name is required" };
  if (!b.role || typeof b.role !== "string") return { error: "role is required" };
  if (!b.phone || typeof b.phone !== "string") return { error: "phone is required" };
  if (!b.location || typeof b.location !== "string") return { error: "location is required" };
  if (b.email !== undefined && b.email !== null && typeof b.email !== "string") return { error: "email must be a string or null" };
  if (b.isActive !== undefined && typeof b.isActive !== "boolean") return { error: "isActive must be a boolean" };
  return {
    data: {
      name: b.name.trim(),
      role: b.role.trim(),
      phone: b.phone.trim(),
      email: typeof b.email === "string" ? b.email.trim() || null : null,
      location: b.location.trim(),
      isActive: typeof b.isActive === "boolean" ? b.isActive : undefined,
    },
  };
}

function parseIdParam(params: Record<string, string>): number | null {
  const id = parseInt(params.id ?? "", 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

router.get("/admin/contacts", requireAdmin, async (_req, res): Promise<void> => {
  const contacts = await db
    .select()
    .from(contactsTable)
    .orderBy(desc(contactsTable.createdAt));
  res.json(contacts);
});

router.post("/admin/contacts", requireAdmin, async (req, res): Promise<void> => {
  const result = parseContactBody(req.body);
  if ("error" in result) { res.status(400).json({ error: result.error }); return; }
  const { data } = result;
  const [contact] = await db
    .insert(contactsTable)
    .values({ ...data, isActive: data.isActive ?? true })
    .returning();
  req.log.info({ contactId: contact.id }, "Contact created");
  res.status(201).json(contact);
});

router.put("/admin/contacts/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseIdParam(req.params as Record<string, string>);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const result = parseContactBody(req.body);
  if ("error" in result) { res.status(400).json({ error: result.error }); return; }

  const [contact] = await db
    .update(contactsTable)
    .set(result.data)
    .where(eq(contactsTable.id, id))
    .returning();
  if (!contact) { res.status(404).json({ error: "Contact not found" }); return; }

  req.log.info({ contactId: contact.id }, "Contact updated");
  res.json(contact);
});

router.delete("/admin/contacts/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseIdParam(req.params as Record<string, string>);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(contactsTable).where(eq(contactsTable.id, id));
  req.log.info({ contactId: id }, "Contact deleted");
  res.sendStatus(204);
});

// ── Settings (admin-only) ────────────────────────────────────────────────────

router.get("/admin/settings", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db.select().from(settingsTable);
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  res.json(result);
});

router.put("/admin/settings", requireAdmin, async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({ error: "Body must be a key-value object" });
    return;
  }

  const entries = (Object.entries(body) as [string, unknown][]).filter(
    (pair): pair is [string, string] => typeof pair[1] === "string"
  );

  for (const [key, value] of entries) {
    await db
      .insert(settingsTable)
      .values({ key, value })
      .onConflictDoUpdate({
        target: settingsTable.key,
        set: { value, updatedAt: new Date() },
      });
  }

  req.log.info({ count: entries.length }, "Settings saved");
  res.json({ saved: entries.length });
});

export default router;
