import { CustomerSegment, DealStage, PrismaClient } from "@prisma/client";

type RankableSegment = Exclude<CustomerSegment, "SPAM">;


const SEGMENT_RANK: Record<RankableSegment, number> = {
  DROPPED: 0,
  POTENTIAL: 1,
  NEW: 2,
  ACTIVE: 3,
  VIP: 4,
};

function parseIntSafe(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}


const DROPPED_AFTER_DAYS = parseIntSafe(process.env.SEGMENT_DROPPED_AFTER_DAYS, 60);

// ngày cách đây n ngày
function daysAgoToDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function touchCustomerActivity(
  prisma: PrismaClient,
  customerId: number,
  opts?: { reviveIfDropped?: boolean }
) {
  const reviveIfDropped = opts?.reviveIfDropped ?? true;

  const current = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { segment: true },
  });
  if (!current) return;

  // SPAM: k đổi segment, chỉ update lastActivityAt
  await prisma.customer.update({
    where: { id: customerId },
    data: { lastActivityAt: new Date() },
  });

  // Nếu đang DROPPED mà có hoạt động trở lại => promote theo deal
  if (reviveIfDropped && current.segment === CustomerSegment.DROPPED) {
    await promoteSegmentFromDeals(prisma, customerId);
  }
}

/**
    tăng cấp segment của khách dựa trên số deal 
 * SPAM không thay đổi
 */
export async function promoteSegmentFromDeals(prisma: PrismaClient, customerId: number) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { segment: true },
  });
  if (!customer) return;

  if (customer.segment === CustomerSegment.SPAM) return;


  const wonCount = await prisma.deal.count({
    where: { customerId, stage: DealStage.CONTRACT },
  });

  let target: CustomerSegment;
  if (wonCount <= 0) target = CustomerSegment.POTENTIAL;
  else if (wonCount === 1) target = CustomerSegment.NEW;
  else if (wonCount === 2) target = CustomerSegment.ACTIVE;
  else target = CustomerSegment.VIP;

  // Nếu hiện tại là DROPPED => cho phép revive lên target
  if (customer.segment === CustomerSegment.DROPPED) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { segment: target },
    });
    return;
  }

  // Promotion-only: chỉ update khi target rank cao hơn current
  const cur = customer.segment as RankableSegment;
  const tar = target as RankableSegment;

  if (SEGMENT_RANK[tar] > SEGMENT_RANK[cur]) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { segment: target },
    });
  }
}

/**
 * Sweep: đẩy khách sang DROPPED nếu lastActivityAt / createdAt quá hạn.
 */
export async function dropInactiveCustomers(prisma: PrismaClient) {
  const cutoff = daysAgoToDate(DROPPED_AFTER_DAYS);

  await prisma.customer.updateMany({
    where: {
      segment: { notIn: [CustomerSegment.SPAM, CustomerSegment.DROPPED] },
      OR: [
        { lastActivityAt: { lt: cutoff } },
        { lastActivityAt: null, createdAt: { lt: cutoff } },
      ],
    },
    data: { segment: CustomerSegment.DROPPED },
  });
}
