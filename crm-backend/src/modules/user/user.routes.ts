import { Router } from "express";
import { authRequired, adminOnly } from "../../middleware/auth";
import {
  me,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  changePassword,
  setUserStatus,
} from "./user.controller";

const router = Router();

// self
router.get("/me", authRequired, me);
router.put("/me", authRequired, updateMe);
router.post("/change-password", authRequired, changePassword);

// admin
router.get("/", authRequired, adminOnly, listUsers);
router.get("/:id", authRequired, adminOnly, getUser);
router.post("/", authRequired, adminOnly, createUser);
router.put("/:id", authRequired, adminOnly, updateUser);
router.post("/:id/status", authRequired, adminOnly, setUserStatus);
router.delete("/:id", authRequired, adminOnly, deleteUser);

export default router;
