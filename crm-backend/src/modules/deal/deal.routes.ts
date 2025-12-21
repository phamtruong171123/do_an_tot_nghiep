import { Router } from "express";
import * as dealController from "./deal.controller";
import { authRequired,adminOnly } from "../../middleware/auth";

const router = Router();

// router.use(requireAuth);

// GET /api/deals?customerId=&page=&pageSize=
router.get("/", authRequired, dealController.getDeals);

// POST /api/deals
router.post("/", authRequired, dealController.postDeal);

// GET /api/deals/:id
router.get("/:id", authRequired, dealController.getDealById);

// PATCH /api/deals/:id
router.patch("/:id", authRequired, dealController.patchDeal);

// GET /api/deals/:id/activities
router.get("/:id/activities", authRequired, dealController.getDealActivities);

// POST /api/deals/:id/activities
router.post("/:id/activities", authRequired, dealController.postDealActivity);

// Contract approval flow
router.post("/:id/request-contract-approval", authRequired, dealController.requestContractApproval);
router.post("/:id/approve-contract", authRequired, adminOnly, dealController.approveContract);
router.post("/:id/reject-contract", authRequired, adminOnly, dealController.rejectContract);

export default router;
