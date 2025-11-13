import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getPageAccessToken(pageId: string) {
  const ch = await prisma.channel.findUnique({ where: { pageId } });
  if (!ch) throw new Error("Channel not found for pageId");
  return ch.pageAccessToken;
}
