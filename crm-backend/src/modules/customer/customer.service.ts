import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Tìm hoặc tạo Customer từ externalId (PSID).
 * externalId: PSID Facebook
 */
export async function findOrCreateCustomerByExternalId(params: {
  externalId: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const { externalId, name, avatarUrl } = params;

  let customer = await prisma.customer.findFirst({
    where: { externalId },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        externalId,
        name: name || null,
        avatarUrl: avatarUrl || null,
      },
    });
  } else if ((name && name !== customer.name) || (avatarUrl && avatarUrl !== customer.avatarUrl)) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: name ?? customer.name,
        avatarUrl: avatarUrl ?? customer.avatarUrl,
      },
    });
  }

  return customer;
}
