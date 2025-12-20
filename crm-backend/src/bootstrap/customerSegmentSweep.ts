import { PrismaClient } from "@prisma/client";
import { dropInactiveCustomers } from "../modules/customer/customerSegment.service";

const prisma = new PrismaClient();

export function bootCustomerSegmentSweep() {
  const minutes = Number(process.env.SEGMENT_SWEEP_INTERVAL_MINUTES ?? 360); // default 6h
  const intervalMs = Math.max(5, minutes) * 60 * 1000;

  setInterval(async () => {
    try {
      await dropInactiveCustomers(prisma);
      // console.log("[segment-sweep] done");
    } catch (e) {
      console.error("[segment-sweep] error:", e);
    }
  }, intervalMs);
}
