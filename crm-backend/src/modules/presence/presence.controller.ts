// src/controllers/presence.controller.ts
import { Request, Response } from "express";
import { touchOnline, getOnlineMap } from "./presence.service";

export async function presencePing(req: Request, res: Response) {
  // cần authenticateJWT trước đó
  const uid = (req as any).user?.id;
  if (!uid) return res.status(401).json({ message: "Unauthenticated" });
  await touchOnline(uid);
  return res.json({ ok: true });
}

// client gửi danh sách userId đang hiển thị, BE trả map online/lastOnlineAt/userLoad
export async function presenceBulk(req: Request, res: Response) {
  const ids = Array.isArray(req.body?.userIds) ? req.body.userIds : [];
  const intIds = ids.map((x: any) => Number(x)).filter((x: unknown) => Number.isFinite(x));
  const map = await getOnlineMap(intIds);
  return res.json({ ok: true, map });
}
