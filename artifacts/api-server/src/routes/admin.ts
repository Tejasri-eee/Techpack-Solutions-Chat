import { Router, type IRouter } from "express";

const router: IRouter = Router();

/**
 * POST /admin/login
 * Verifies the admin password against the ADMIN_PASSWORD environment variable.
 * The password never lives in the frontend bundle — it's checked server-side only.
 */
router.post("/admin/login", async (req, res): Promise<void> => {
  const { password } = req.body as { password?: string };

  if (!password || typeof password !== "string") {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    req.log.error("ADMIN_PASSWORD environment variable is not set");
    res.status(500).json({ error: "Admin login is not configured. Set the ADMIN_PASSWORD environment variable." });
    return;
  }

  if (password !== adminPassword) {
    req.log.warn("Failed admin login attempt");
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  req.log.info("Admin logged in successfully");
  res.json({ success: true });
});

export default router;
