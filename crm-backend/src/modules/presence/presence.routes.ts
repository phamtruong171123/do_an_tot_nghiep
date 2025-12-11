import { Router } from "express";
import { authRequired } from "../../middleware/auth";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = Router();

router.post("/presence/ping", authRequired, async (req, res) => {
  const uid = (req as any).user?.id;
  if (!uid) return res.status(401).json({ message: "Unauthenticated" });

  await prisma.agentProfile.upsert({
    where: { userId: uid },
    create: { userId: uid, online: true, lastOnlineAt: new Date(), userLoad: 0 },
    update: { online: true, lastOnlineAt: new Date() },
  });

  return res.json({ ok: true });
});

export default router;
