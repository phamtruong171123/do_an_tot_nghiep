import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * externalId = PSID Facebook (senderId)
 * name, avatarUrl có thể truyền từ profile FB hoặc từ conversation.title
 */
export async function findOrCreateCustomerByExternalId(params: {
  externalId: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const { externalId, name, avatarUrl } = params;

  // id = externalId luôn
  let customer = await prisma.customer.findUnique({
    where: { id: externalId },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        id: externalId,
        name: name || null,
        avatarUrl: avatarUrl || null,
      },
    });
  } else {
    // optional: update name/avatar nếu có thông tin mới
    if ((name && name !== customer.name) || (avatarUrl && avatarUrl !== customer.avatarUrl)) {
      customer = await prisma.customer.update({
        where: { id: externalId },
        data: {
          name: name || customer.name,
          avatarUrl: avatarUrl || customer.avatarUrl,
        },
      });
    }
  }

  return customer;
}
