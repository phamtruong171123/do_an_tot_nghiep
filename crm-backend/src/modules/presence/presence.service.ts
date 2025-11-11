
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const PRESENCE_OFFLINE_AFTER_MS = 2 * 60 * 1000; // 2 phút

export async function touchOnline(userId: number) {
  // Đánh dấu online + cập nhật mốc
  await prisma.agentProfile.upsert({
    where: { userId },
    create: { userId, online: true, lastOnlineAt: new Date() },
    update: { online: true, lastOnlineAt: new Date() },
  });
}

export async function markOfflineIfExpired(now = Date.now()) {
  const edge = new Date(now - PRESENCE_OFFLINE_AFTER_MS);
  await prisma.agentProfile.updateMany({
    where: {
      online: true,
      OR: [{ lastOnlineAt: { lt: edge } }, { lastOnlineAt: null }],
    },
    data: { online: false },
  });
}

export async function getOnlineMap(userIds: number[]) {
  if (!userIds.length) return {};
  const rows = await prisma.agentProfile.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, online: true, lastOnlineAt: true, userLoad: true },
  });
  const map: Record<number, { online: boolean; lastOnlineAt: Date | null; userLoad: number }> = {};
  for (const r of rows) map[r.userId] = { online: r.online, lastOnlineAt: r.lastOnlineAt, userLoad: r.userLoad };
  return map;
}
