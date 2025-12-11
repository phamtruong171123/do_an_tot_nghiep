import { Router } from "express";
import {
  listTicketsHandler,
  listTicketsByUserHandler,
  getTicketHandler,
  createTicketHandler,
  updateTicketHandler,
  assignTicketHandler,
  listTicketNotesHandler,
  createTicketNoteHandler,
} from "./ticket.controller";
import { authRequired } from "../../middleware/auth";

const router = Router();

// LIST tất cả (có filter, mine=1)
router.get("/", authRequired, listTicketsHandler);

// LIST theo user cụ thể
router.get("/by-user/:userId", authRequired, listTicketsByUserHandler);

// DETAIL
router.get("/:id", authRequired, getTicketHandler);

// CREATE
router.post("/", authRequired, createTicketHandler);

// UPDATE chung (status, priority, subject, description)
router.patch("/:id", authRequired, updateTicketHandler);

// TRANSFER assignee – chỉ ADMIN
router.patch("/:id/assign", authRequired, assignTicketHandler);

router.get("/:id/notes", authRequired, listTicketNotesHandler);

router.post("/:id/notes", authRequired, createTicketNoteHandler);

export default router;
