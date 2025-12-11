import { PrismaClient, MessageSenderType } from "@prisma/client";
import { fetchFacebookUserProfile } from "../facebook/facebook.service";
import { findOrCreateCustomerByExternalId } from "../customer/customer.service";
const prisma = new PrismaClient();

// Tìm hoặc tạo Conversation dựa trên pageId và externalUserId (PSID).
export async function findOrCreateConversationByPageAndUser(
  pageId: string,
  externalUserId: string,
  opts?: { title?: string | null; avatarUrl?: string | null }
) {
  // 1. Tìm channel theo pageId
  const channel = await prisma.channel.findUnique({
    where: { pageId },
  });
  if (!channel) {
    throw new Error(`Channel not found for pageId=${pageId}`);
  }

  const profile = await fetchFacebookUserProfile(pageId, externalUserId);
  const { name: title, avatarUrl } = profile;
  // 2. Tìm / tạo customer theo externalId = PSID
  const customer = await findOrCreateCustomerByExternalId({
    externalId: externalUserId,
    name: title ?? undefined,
    avatarUrl: avatarUrl ?? undefined,
  });

  // 3. Tìm conversation theo (channelId, externalUserId)
  let conversation = await prisma.conversation.findUnique({
    where: {
      channelId_externalUserId: {
        channelId: channel.id,
        externalUserId,
      },
    },
  });

  if (!conversation) {
    //  Chưa có → tạo mới, gắn luôn customerId
    conversation = await prisma.conversation.create({
      data: {
        channelId: channel.id,
        externalUserId,
        title: title || null,
        avataUrl: avatarUrl || null,
        customerId: customer.id,
      },
    });
  } else if (!conversation.customerId || conversation.customerId !== customer.id) {
    // Đã có nhưng chưa gắn customer / gắn sai → update
    conversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        customerId: customer.id,
        ...(title !== undefined ? { title } : {}),
        ...(avatarUrl !== undefined ? { avataUrl: avatarUrl } : {}),
      },
    });
  }

  // Trả lại cho caller
  return { conversation, channel };
}

export async function saveInboundMessage(
  pageId: string,
  externalUserId: string,
  text: string,
  mid?: string
) {
  const { conversation } = await findOrCreateConversationByPageAndUser(pageId, externalUserId);

  const msg = await prisma.message.upsert({
    where: {
      externalMessageId: mid ?? `__nil_${pageId}_${externalUserId}_${Date.now()}`,
    },
    update: {},
    create: {
      conversationId: conversation.id,
      direction: "IN",
      text,
      sentBy: "CUSTOMER",
      externalMessageId: mid ?? null,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: msg.createdAt,
      lastMessageText: text,
      unreadCount: { increment: 1 },
    },
  });

  return { conversationId: conversation.id, message: msg };
}

export async function saveOutboundMessage(
  conversationId: string,
  text: string,
  externalMessageId?: string,
  sentBy: MessageSenderType = "AGENT"
) {
  const msg = await prisma.message.create({
    data: {
      conversationId,
      direction: "OUT",
      text,
      sentBy,
      externalMessageId: externalMessageId ?? null,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: msg.createdAt, lastMessageText: text },
  });

  return msg;
}

export async function listConversations(params: {
  q?: string;
  mineUserId?: number | null;
  limit?: number;
}) {
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

// ví dụ: đếm số hội thoại mà agent hiện tại có unread > 0
export async function getUnreadConversationCountForUser(userId: number) {
  return prisma.conversation.count({
    where: {
      // tuỳ hệ thống của bạn:
      // - nếu dùng assigneeId: chỉ đếm những cuộc hội thoại được gán cho user
      // - hoặc đếm tất cả conv mà user có quyền xem
      assigneeId: userId,
      unreadCount: {
        gt: 0,
      },
    },
  });
}
