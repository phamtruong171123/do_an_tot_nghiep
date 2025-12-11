import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const THRESHOLD_MS = 60_000;

export async function presenceTouch(
  req: { user: { id: any }; session: { presenceLastTouch: number } },
  res: any,
  next: () => void
) {
  try {
    const uid = req.user?.id; // sau authenticateJWT
    if (!uid) return next();

    const now = Date.now();
    const last = (req.session?.presenceLastTouch as number) || 0;
    if (now - last > THRESHOLD_MS) {
      req.session && (req.session.presenceLastTouch = now);
      await prisma.agentProfile.upsert({
        where: { userId: uid },
        create: { userId: uid, online: true, lastOnlineAt: new Date() },
        update: { online: true, lastOnlineAt: new Date() },
      });
    }
  } catch (e) {
    // log nếu cần
  }
  next();
}
