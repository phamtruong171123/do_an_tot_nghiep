import { PrismaClient } from "@prisma/client";
import { fetchFacebookUserProfile } from "../facebook/facebook.service";
const prisma = new PrismaClient();

export async function findOrCreateConversationByPageAndUser(pageId: string, externalUserId: string) {
  const channel = await prisma.channel.findUnique({ where: { pageId } });
  if (!channel) throw new Error("Channel not found for pageId");

  let conv = await prisma.conversation.findUnique({
    where: { channelId_externalUserId: { channelId: channel.id, externalUserId } },
  });

  if (!conv) {
    const defaultAssigneeId = process.env.DEFAULT_ASSIGNEE_USER_ID
      ? Number(process.env.DEFAULT_ASSIGNEE_USER_ID)
      : undefined;

      //lấy tên và avatar từ facebook
      let title: string = "Facebook User";
      let avatarUrl: string | null = null;
      try {
        const profile = await fetchFacebookUserProfile(pageId, externalUserId);
        title = profile.name;
        avatarUrl = profile.avatarUrl;
      } catch (error) {
        console.warn("Failed to fetch Facebook user profile:", error);
      }

    conv = await prisma.conversation.create({
      data: {
        channelId: channel.id,
        externalUserId,
        title: title || "Facebook User",
        assigneeId: defaultAssigneeId,
        assignedAt: defaultAssigneeId ? new Date() : null,
        avataUrl: avatarUrl || null,
      },
    });
  }
  return { channel, conv };
}

export async function saveInboundMessage(pageId: string, externalUserId: string, text: string, mid?: string) {
  const { conv } = await findOrCreateConversationByPageAndUser(pageId, externalUserId);

  const msg = await prisma.message.upsert({
    where: { externalMessageId: mid ?? `__nil_${pageId}_${externalUserId}_${Date.now()}` },
    update: {},
    create: {
      conversationId: conv.id,
      direction: "IN",
      text,
      externalMessageId: mid ?? null,
    },
  });

  await prisma.conversation.update({
    where: { id: conv.id },
    data: { lastMessageAt: msg.createdAt, lastMessageText: text , unreadCount: { increment: 1 } },
  });

  return { conversationId: conv.id, message: msg };
}

export async function saveOutboundMessage(conversationId: string, text: string, externalMessageId?: string) {
  const msg = await prisma.message.create({
    data: { conversationId, direction: "OUT", text, externalMessageId: externalMessageId ?? null },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: msg.createdAt, lastMessageText: text },
  });

  return msg;
}

export async function listConversations(params: { q?: string; mineUserId?: number | null; limit?: number }) {
  const { q, mineUserId, limit = 20 } = params;
  const where: any = q
    ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { externalUserId: { contains: q } }] }
    : {};
  if (mineUserId) where.assigneeId = mineUserId;

  return prisma.conversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: Math.min(limit, 100),
    include: {
      channel: { select: { type: true } },
      assignee: { select: { id: true, username: true, status: true } },
    },
  });
}

export async function listMessages(conversationId: string, limit = 50) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: Math.min(limit, 500),
  });
}

export async function getConversationWithChannel(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: { channel: true },
  });
}

export async function assignConversation(conversationId: string, userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Assignee user not found");

  return prisma.conversation.update({
    where: { id: conversationId },
    data: { assigneeId: userId, assignedAt: new Date() },
    include: { assignee: { select: { id: true, username: true } } },
  });
}
